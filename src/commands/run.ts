import { Runtime } from "@observablehq/runtime";
import { Library } from "../Library";
import { OakCompiler } from "../oak-compile";
import {
  formatCellName,
  formatPath,
  hashFile,
  hashString,
  getStat,
  CellSignature,
} from "../utils";
import { dirname, join } from "path";
import { EventEmitter } from "events";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import { mkdirsSync } from "fs-extra";
import { OakDB } from "../db";
import Task from "../Task";
import { createWriteStream, createFileSync, readFileSync } from "fs-extra";

async function runTask(
  oakfileHash: string,
  runHash: string,
  cellName: string,
  oakDB: OakDB,
  logger: pino.Logger,
  cell: Task,
  logDirectory: string,
  ancestorHash: string
): Promise<number> {
  const logFile = join(logDirectory, `${cellName}.log`);
  logger.info(`Running task for ${cell.target}. Logfile: ${logFile}`);
  await oakDB.addLog(
    oakfileHash,
    runHash,
    cellName,
    ancestorHash,
    logFile,
    new Date().getTime()
  );

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

function runCellDecorator(
  oakfileHash: string,
  runHash: string,
  logger: pino.Logger,
  logDirectory: string,
  oakDB: OakDB
) {
  return function(
    cellFunction: (...any) => any,
    cellName: string,
    cellReferences: string[],
    cellHashMap: Map<string, CellSignature>,
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
            oakfileHash,
            runHash,
            cellName,
            oakDB,
            logger,
            currCell,
            logDirectory,
            cellHashMap.get(cellName).ancestorHash
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
            oakfileHash,
            runHash,
            cellName,
            oakDB,
            logger,
            currCell,
            logDirectory,
            cellHashMap.get(cellName).ancestorHash
          );
          currCell.stat = await getStat(currCell.target);
          return currCell;
        }

        const cellHashLookup = await oakDB.findMostRecentCellHash(
          cellHashMap.get(cellName).ancestorHash
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
            oakfileHash,
            runHash,
            cellName,
            oakDB,
            logger,
            currCell,
            logDirectory,
            cellHashMap.get(cellName).ancestorHash
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

export async function oak_run(args: {
  filename: string;
  targets: readonly string[];
}): Promise<void> {
  const logger = pino({ name: "oak run", prettyPrint: true });

  const targetSet = new Set(args.targets);
  const oakfilePath = fileArgument(args.filename);
  const oakfileStat = await getStat(oakfilePath);
  const oakDB = new OakDB(oakfilePath);

  const startTime = new Date();

  const runtime = new Runtime(new Library());
  const compiler = new OakCompiler();
  const oakfileHash = hashFile(oakfilePath);
  const runHash = hashString(`${startTime.getTime()}`);
  const logDirectory = join(
    dirname(oakfilePath),
    ".oak",
    "logs",
    `${oakfileHash}-${startTime.getTime()}`
  );
  mkdirsSync(logDirectory);
  const { define, cellHashMap } = await compiler.file(
    oakfilePath,
    runCellDecorator(oakfileHash, runHash, logger, logDirectory, oakDB),
    null
  );
  // on succesful compile, add to oak db

  await oakDB.registerOakfile(
    oakfileHash,
    oakfileStat.mtime.getTime(),
    cellHashMap
  );
  await oakDB.addRun(
    oakfileHash,
    runHash,
    startTime.getTime(),
    JSON.stringify(args.targets)
  );

  const events: {
    ancestorHash: string;
    type: string;
    name: string;
    time: number;
    meta?: string;
  }[] = [];
  const origDir = process.cwd();
  process.chdir(dirname(oakfilePath));

  logger.info(
    "oak-run",
    `Oak: ${formatPath(oakfilePath)}${
      targetSet.size > 0
        ? ` - targets: ${Array.from(targetSet)
            .map(formatCellName)
            .join(",")}`
        : ""
    }`
  );
  const ee = new EventEmitter();

  ee.on("pending", name => {
    logger.debug("pending", name);
    events.push({
      type: "pending",
      ancestorHash: cellHashMap.get(name).ancestorHash,
      name,
      time: new Date().getTime(),
    });
  });
  ee.on("fulfilled", name => {
    logger.debug("fulfilled", name);
    events.push({
      type: "fulfilled",
      ancestorHash: cellHashMap.get(name).ancestorHash,
      name,
      time: new Date().getTime(),
    });
  });
  ee.on("rejected", (name, error) => {
    logger.error("rejected", name);
    events.push({
      type: "rejected",
      ancestorHash: cellHashMap.get(name).ancestorHash,
      name,
      time: new Date().getTime(),
      meta: error,
    });
  });

  const cells: Set<string> = new Set();
  const m1 = runtime.module(define, name => {
    if (targetSet.size === 0 || targetSet.has(name)) {
      cells.add(name);
      return {
        pending() {
          ee.emit("pending", name);
        },
        fulfilled(value) {
          ee.emit("fulfilled", name, value);
        },
        rejected(error) {
          ee.emit("rejected", name, error);
        },
      };
    }
  });
  await runtime._compute();
  await Promise.all(Array.from(cells).map(cell => m1.value(cell)));
  runtime.dispose();
  process.chdir(origDir);
  await oakDB.addEvents(runHash, events);
}
