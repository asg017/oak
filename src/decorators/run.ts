import Task from "../Task";
import { formatPath, getStat } from "../utils";
import * as log from "npmlog";
import { join } from "path";
import { createWriteStream, createFileSync } from "fs-extra";

async function runTask(cell, logFile: string): Promise<number> {
  const {
    process: childProcess,
    outStream: taskOutStream,
    config: taskConfig,
  } = cell.runTask();
  createFileSync(logFile);
  const logStream = createWriteStream(logFile);

  childProcess.stdout.on("data", chunk => {
    logStream.write(chunk);
    if (taskOutStream && taskConfig.stdout) {
      taskOutStream.write(chunk);
    }
  });

  childProcess.stderr.on("data", chunk => {
    logStream.write(chunk);
    if (taskOutStream && taskConfig.stderr) {
      logStream.write(chunk);
    }
  });

  return new Promise((resolve, reject) => {
    childProcess.on("error", err => {
      reject(err);
    });
    childProcess.on("exit", code => {
      if (code !== 0) return reject(code);
      resolve(code);
    });
  });
}

export default function(logDirectory) {
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
          log.info(
            "oak-run decorator",
            `${formatPath(currCell.target)} - Doesn't exist - running recipe...`
          );
          const logFile = join(logDirectory, cellName);
          await runTask(currCell, logFile);
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
          log.info(
            "oak-run decorator",
            `${formatPath(currCell.target)} - out of date:`
          );
          if (outOfDateCellDependencies.length > 0)
            log.info(
              "oak-run decorator",
              `Cell Dependencies: ${outOfDateCellDependencies
                .map(d => `\t${formatPath(d.path)}`)
                .join(",")}`
            );
          if (outOfDateWatchFiles.length > 0)
            log.info(
              "oak-run decorator",
              `Watch Files: ${outOfDateWatchFiles
                .map(d => `\t${formatPath(d.path)}`)
                .join(",")}`
            );

          const logFile = join(logDirectory, cellName);
          await runTask(currCell, logFile);
          currCell.stat = await getStat(currCell.target);
          return currCell;
        } else {
          log.info(
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
