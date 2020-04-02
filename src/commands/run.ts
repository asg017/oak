import { Runtime } from "@observablehq/runtime";
import { Library } from "../Library";
import { OakCompiler } from "../oak-compile";
import {
  formatCellName,
  formatPath,
  hashFile,
  hashString,
  getStat,
  getSignature,
} from "../utils";
import { dirname, join } from "path";
import { EventEmitter } from "events";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import { mkdirsSync } from "fs-extra";
import { OakDB, getAndMaybeIntializeOakDB } from "../db";
import Task from "../Task";
import { createWriteStream, createFileSync, readFileSync } from "fs-extra";
import decorator from "../decorator";

async function runTask(
  oakfileHash: string,
  runHash: string,
  cellName: string,
  oakDB: OakDB,
  logger: pino.Logger,
  cell: Task,
  logDirectory: string,
  ancestorHash: string,
  dependenciesSignature: string,
  freshStatus: string
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
  const taskExecutionRowID = await oakDB.addTaskExecution(
    runHash,
    cellName,
    ancestorHash,
    dependenciesSignature,
    freshStatus,
    new Date().getTime(),
    logFile
  );
  const runProcessStart = new Date().getTime();
  const {
    process: childProcess,
    outStream: taskOutStream,
    config: taskConfig,
  } = cell.runTask();
  createFileSync(logFile);
  const runProcessPID = process.pid;
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

  const { runExitCode, runProcessEnd } = await new Promise(
    (resolve, reject) => {
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
        resolve({ runExitCode: code, runProcessEnd: new Date().getTime() });
      });
    }
  );
  const finalTargetSignature = await getSignature(cell.target);
  await oakDB.updateTaskExection(
    taskExecutionRowID,
    finalTargetSignature,
    runProcessStart,
    runProcessEnd,
    runExitCode,
    runProcessPID.toString()
  );
  return runExitCode;
}

export async function oak_run(args: {
  filename: string;
  targets: readonly string[];
}): Promise<void> {
  const logger = pino({ name: "oak run", prettyPrint: true });

  const targetSet = new Set(args.targets);
  const oakfilePath = fileArgument(args.filename);
  const oakfileStat = await getStat(oakfilePath);
  const oakDB = await getAndMaybeIntializeOakDB(oakfilePath);

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

  const d = decorator(
    {
      onTaskUpToDate: (t, decoratorArgs) => {
        logger.info(
          "oak-run decorator",
          `${formatPath(t.target)} - not out of date `
        );
        return t;
      },
      onTaskCellDefinitionChanged: async (
        t,
        decoratorArgs,
        cellArgs,
        taskContext
      ) => {
        logger.info(
          "oak-run decorator",
          `${formatPath(
            t.target
          )} - out of date because direct cell defintion changed since last Oakfile.`
        );
        t.watch;
        await runTask(
          oakfileHash,
          runHash,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "out-def"
        );
        return t;
      },
      onTaskDependencyChanged: async (
        t,
        decoratorArgs,
        cellArgs,
        taskContext
      ) => {
        logger.info(
          "oak-run decorator",
          `${formatPath(
            t.target
          )} - out of date because one or more of its dependencies are out of date.`
        );
        await runTask(
          oakfileHash,
          runHash,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "out-dep"
        );
        return t;
      },
      onTaskTargetMissing: async (t, decoratorArgs, cellArgs, taskContext) => {
        logger.info(
          "oak-run decorator",
          `${formatPath(t.target)} - Doesn't exist - running recipe...`
        );
        await runTask(
          oakfileHash,
          runHash,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "dne"
        );
        return t;
      },
    },
    oakDB
  );

  const { define, cellHashMap } = await compiler.file(oakfilePath, d, null);
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
