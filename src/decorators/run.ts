import Task from "../Task";
import { formatPath, getStat } from "../utils";
import pino from "pino";
import { join } from "path";
import { createWriteStream, createFileSync, readFileSync } from "fs-extra";
import { OakDB } from "../db";

async function runTask(
  runHash: string,
  cellName: string,
  oakDB: OakDB,
  logger: pino.Logger,
  cell: Task,
  logDirectory: string
): Promise<number> {
  const logFile = join(logDirectory, `${cellName}.log`);
  logger.info(`Running task for ${cell.target}. Logfile: ${logFile}`);
  await oakDB.addLog(runHash, cellName, logFile, new Date().getTime());

  const {
    process: childProcess,
    outStream: taskOutStream,
    config: taskConfig,
  } = cell.runTask();
  createFileSync(logFile);
  const logStream = createWriteStream(logFile);

  childProcess.stdout.on("data", chunk => {
    if (logStream.writable) logStream.write(chunk);
    if (taskOutStream && taskConfig.stdout) {
      taskOutStream.write(chunk);
    }
  });

  childProcess.stderr.on("data", chunk => {
    if (logStream.writable) logStream.write(chunk);
    if (taskOutStream && taskConfig.stderr) {
      logStream.write(chunk);
    }
  });

  return new Promise((resolve, reject) => {
    childProcess.on("error", err => {
      logger.error(`childProcess error event.`);
      logStream.end();
      reject(err);
    });
    childProcess.on("exit", code => {
      logStream.end();
      if (code !== 0) {
        // TODO lets log with chunks
        console.log(readFileSync(logFile, { encoding: "utf8" }));
        return reject({ code });
      }
      resolve(code);
    });
  });
}

export default function(
  runHash: string,
  logger: pino.Logger,
  logDirectory: string,
  oakDB: OakDB,
  getHash: (cellName: string) => { cellHash: string; ancestorHash: string }
) {
  return function(
    cellFunction: (...any) => any,
    cellName: string,
    cellReferences: string[],
    baseModuleDir: string
  ): (...any) => any {
    return async function(...dependencies) {
      // dont try and get Task for cell depends like `cell` or `shell`
      let cellDependents = [];
      dependencies.map(dependency => {
        if (dependency instanceof Task) {
          cellDependents.push(dependency);
        }
      });
      let currCell = await cellFunction(...dependencies);

      if (currCell instanceof Task) {
        await currCell.updateBasePath(baseModuleDir);

        const watchFiles = currCell.watch;
        const watchStats = await Promise.all(
          watchFiles.map(async watchFile => {
            const stat = await getStat(watchFile);
            return { path: watchFile, stat };
          })
        );

        // run recipe if no file or if it's out of date
        if (currCell.stat === null) {
          logger.info(
            "oak-run decorator",
            `${formatPath(currCell.target)} - Doesn't exist - running recipe...`
          );
          await runTask(
            runHash,
            cellName,
            oakDB,
            logger,
            currCell,
            logDirectory
          );
          currCell.stat = await getStat(currCell.target);
          return currCell;
        }
        const outOfDateCellDependencies = cellDependents.filter(
          c => currCell.stat.mtime <= c.stat.mtime
        );
        const outOfDateWatchFiles = watchStats.filter(
          ({ stat }) => currCell.stat.mtime <= stat.mtime
        );
        if (
          outOfDateCellDependencies.length > 0 ||
          outOfDateWatchFiles.length > 0
        ) {
          logger.info(
            "oak-run decorator",
            `${formatPath(currCell.target)} - out of date:`
          );
          if (outOfDateCellDependencies.length > 0)
            logger.info(
              "oak-run decorator",
              `Cell Dependencies: ${outOfDateCellDependencies
                .map(d => `\t${formatPath(d.target)}`)
                .join(",")}`
            );
          if (outOfDateWatchFiles.length > 0)
            logger.info(
              "oak-run decorator",
              `Watch Files: ${outOfDateWatchFiles
                .map(d => `\t${formatPath(d.path)}`)
                .join(",")}`
            );

          await runTask(
            runHash,
            cellName,
            oakDB,
            logger,
            currCell,
            logDirectory
          );
          currCell.stat = await getStat(currCell.target);
          return currCell;
        }

        const cellHashLookup = await oakDB.findMostRecentCellHash(
          getHash(cellName).ancestorHash
        );
        if (
          !cellHashLookup ||
          cellHashLookup.mtime > currCell.stat.mtime.getTime()
        ) {
          logger.info(
            "oak-run decorator",
            `${formatPath(
              currCell.target
            )} - out of date because direct cell defintion changed since last Oakfile.`
          );
          await runTask(
            runHash,
            cellName,
            oakDB,
            logger,
            currCell,
            logDirectory
          );
          currCell.stat = await getStat(currCell.target);
          return currCell;
        } else {
          logger.info(
            "oak-run decorator",
            `${formatPath(currCell.target)} - not out of date `
          );
          return currCell;
        }
      }
      return currCell;
    };
  };
}
