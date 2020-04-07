import { Runtime } from "@observablehq/runtime";
import { RunLibrary, RunScheduleLibrary } from "../Library";
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
import { mkdirsSync, ensureFile, ensureDir } from "fs-extra";
import { OakDB, getAndMaybeIntializeOakDB } from "../db";
import Task from "../Task";
import { createWriteStream, createFileSync, readFileSync } from "fs-extra";
import decorator from "../decorator";

async function runTask(
  oakfileHash: string,
  runHash: string,
  scheduled: boolean,
  cellName: string,
  oakDB: OakDB,
  logger: pino.Logger,
  cell: Task,
  logDirectory: string,
  ancestorHash: string,
  dependenciesSignature: string,
  freshStatus: string,
  cellArgs: any[]
): Promise<number> {
  let logFile = join(logDirectory, `${cellName}.log`);
  if (scheduled) {
    // if the task was scheduled, or if any of it's upstream
    // tasks dependencies were scheduled, then we need to save the
    // target to a different folder.
    for (const dep of cellArgs) {
      if (dep instanceof Task) {
        if (dep.dependencySchedule)
          cell.dependencySchedule = dep.dependencySchedule;
        break;
      }
    }
    if (cell.dependencySchedule) {
      cell.updateBasePath(
        join(
          cell.baseTargetDir,
          ".oak_schedule",
          cell.dependencySchedule.lastTick.emitTime.getTime().toString()
        )
      );
      logFile = join(
        logDirectory,
        "scheduled",
        cell.dependencySchedule.lastTick.emitTime.getTime().toString(),
        `${cellName}.log`
      );
    }
  }
  logger.info(`${cellName} Running task for ${cell.target}. `);
  logger.info(`\tLogfile: ${logFile}`);
  await oakDB.addLog(
    oakfileHash,
    runHash,
    cellName,
    ancestorHash,
    logFile,
    new Date().getTime()
  );
  if (cell.createFileBeforeRun) await ensureFile(cell.target);
  if (cell.createDirectoryBeforeRun) await ensureDir(cell.target);
  const taskExecutionRowID = await oakDB.addTaskExecution(
    runHash,
    Boolean(cell.dependencySchedule),
    cellName,
    ancestorHash,
    dependenciesSignature,
    freshStatus,
    new Date().getTime(),
    logFile,
    cell.target,
    cell.dependencySchedule?.id
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
  schedule?: boolean;
}): Promise<void> {
  const logger = pino({ name: "oak run", prettyPrint: true });

  const targetSet = new Set(args.targets);
  const oakfilePath = fileArgument(args.filename);
  const oakfileStat = await getStat(oakfilePath);
  const oakDB = await getAndMaybeIntializeOakDB(oakfilePath);

  const startTime = new Date();

  const library = args.schedule ? new RunScheduleLibrary() : new RunLibrary();
  const runtime = new Runtime(library);
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
          args.schedule,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "out-def",
          cellArgs
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
          args.schedule,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "out-dep",
          cellArgs
        );
        return t;
      },
      onTaskTargetChanged: async (t, decoratorArgs, cellArgs, taskContext) => {
        logger.info(
          "oak-run decorator",
          `${formatPath(
            t.target
          )} - out of date because the targen has changed since last run.`
        );
        await runTask(
          oakfileHash,
          runHash,
          args.schedule,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "out-target",
          cellArgs
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
          args.schedule,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "dne",
          cellArgs
        );
        return t;
      },
    },
    oakDB,
    args.schedule
      ? {
          // if the Task has a schedule, then it is never fresh
          check: (task: Task) => {
            return Boolean(task.schedule);
          },
          value: async (t, decoratorArgs, cellArgs, taskContext) => {
            logger.info(
              "oak-run decorator",
              `${formatPath(t.target)} - Scheduled, running task...`
            );
            await runTask(
              oakfileHash,
              runHash,
              args.schedule,
              decoratorArgs.cellName,
              oakDB,
              logger,
              t,
              logDirectory,
              decoratorArgs.cellSignature.ancestorHash,
              taskContext.dependenciesSignature,
              "schedule",
              cellArgs
            );
            return t;
          },
        }
      : null,
    args.schedule
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
    Boolean(args.schedule),
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
      ancestorHash: cellHashMap.get(name)?.ancestorHash || "",
      name,
      time: new Date().getTime(),
    });
  });
  ee.on("fulfilled", name => {
    logger.debug("fulfilled", name);
    events.push({
      type: "fulfilled",
      ancestorHash: cellHashMap.get(name)?.ancestorHash || "",
      name,
      time: new Date().getTime(),
    });
  });
  ee.on("rejected", (name, error) => {
    logger.error("rejected", name);
    events.push({
      type: "rejected",
      ancestorHash: cellHashMap.get(name)?.ancestorHash || "",
      name,
      time: new Date().getTime(),
      meta: error,
    });
  });

  const cells: Set<string> = new Set();
  const m1 = runtime.module(define, name => {
    if (name && (targetSet.size === 0 || targetSet.has(name))) {
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
  if (!args.schedule) {
    await Promise.all(Array.from(cells).map(cell => m1.value(cell)));
    runtime.dispose();
    process.chdir(origDir);
    await oakDB.addEvents(runHash, events);
  }
}
