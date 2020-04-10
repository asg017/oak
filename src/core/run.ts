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
import { ScheduleTick, Scheduler } from "../Library/Scheduler";

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
  cellArgs: any[],
  hooks?: OakRunHooks
): Promise<number> {
  let logFile = join(logDirectory, `${cellName}.log`);
  if (scheduled) {
    // if the task was scheduled, or if any of it's upstream
    // tasks dependencies were scheduled, then we need to save the
    // target to a different folder.
    // it should be the most schedule with the most recent lastTick
    const cellsWithSchedule = cellArgs
      .filter(dep => dep instanceof Task && dep.dependencySchedule)
      .sort(
        (a, b) =>
          b.dependencySchedule.lastTick.emitTime.getTime() -
          a.dependencySchedule.lastTick.emitTime.getTime()
      );
    if (cellsWithSchedule.length)
      cell.dependencySchedule = cellsWithSchedule[0].dependencySchedule;

    if (cell.dependencySchedule) {
      cell.updateBasePath(
        join(
          cell.baseTargetDir,
          ".oak_schedule",
          cell.dependencySchedule.id.toString(),
          cell.dependencySchedule.lastTick.id.toString(),
          cell.dependencySchedule.lastTick.emitTime.getTime().toString()
        )
      );
      logFile = join(
        logDirectory,
        "scheduled",
        cell.dependencySchedule.id.toString(),
        cell.dependencySchedule.lastTick.id.toString(),
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
    cell?.dependencySchedule?.id,
    cell?.dependencySchedule?.lastTick?.id,
    cell?.dependencySchedule?.lastTick?.emitTime?.getTime()
  );
  hooks?.onTaskExectionStart(cellName, cell.target);
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
    Number(taskExecutionRowID),
    finalTargetSignature,
    runProcessStart,
    runProcessEnd,
    runExitCode,
    runProcessPID.toString()
  );
  hooks?.onTaskExectionEnd(cellName);
  return runExitCode;
}

type OakRunHooks = {
  onTaskExectionStart(cellName: string, cellTarget: string);
  onTaskExectionEnd(cellName: string);
  onTaskNotFresh(cellName: string, reason: string);
  onTaskFresh(cellName: string, cellTarget: string);
  onCellObserved(cellName: string);
  onCellPending(cellName: string);
  onCellFulfilled(cellName: string);
  onCellRejected(cellName: string);
  onScheduler?(scheduler: Scheduler);
  onScheduleTick(tick: ScheduleTick, scheduler: Scheduler);
};

export function defaultHookEmitter(ee: EventEmitter) {
  return {
    onTaskExectionStart: (cellName: string, cellTarget) =>
      ee.emit("te-start", cellName, cellTarget),
    onTaskExectionEnd: (cellName: string) => ee.emit("te-end", cellName),
    onTaskNotFresh: (cellName: string, reason: string) =>
      ee.emit("t-nf", cellName, reason),
    onTaskFresh: (cellName: string, cellTarget: string) =>
      ee.emit("t-f", cellName, cellTarget),
    onCellObserved: (cellName: string) => ee.emit("co", cellName),
    onCellPending: (cellName: string) => ee.emit("cp", cellName),
    onCellFulfilled: (cellName: string) => ee.emit("cf", cellName),
    onCellRejected: (cellName: string) => ee.emit("cr", cellName),
    onScheduleTick: (tick, scheduler) => ee.emit("st", tick, scheduler),
    onScheduler: scheduler => ee.emit("s", scheduler),
  };
}

export async function oak_run(args: {
  filename: string;
  targets: readonly string[];
  schedule?: boolean;
  hooks?: OakRunHooks;
}): Promise<void> {
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
  const oakLogPath = join(
    dirname(oakfilePath),
    ".oak",
    "oak-logs",
    `run-${runHash}.log`
  );
  mkdirsSync(dirname(oakLogPath));

  const logger = pino({ name: "oak run" }, createWriteStream(oakLogPath));

  const d = decorator(
    {
      onTaskUpToDate: (t: Task, decoratorArgs) => {
        args?.hooks?.onTaskFresh(decoratorArgs.cellName, t.target);
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
        args?.hooks?.onTaskNotFresh(decoratorArgs.cellName, "out-def");
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
          cellArgs,
          args?.hooks
        );
        return t;
      },
      onTaskDependencyChanged: async (
        t,
        decoratorArgs,
        cellArgs,
        taskContext
      ) => {
        args?.hooks?.onTaskNotFresh(decoratorArgs.cellName, "out-dep");
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
          cellArgs,
          args?.hooks
        );
        return t;
      },
      onTaskTargetChanged: async (t, decoratorArgs, cellArgs, taskContext) => {
        args?.hooks?.onTaskNotFresh(decoratorArgs.cellName, "out-target");
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
          cellArgs,
          args?.hooks
        );
        return t;
      },
      onTaskTargetMissing: async (t, decoratorArgs, cellArgs, taskContext) => {
        args?.hooks?.onTaskNotFresh(decoratorArgs.cellName, "dne");
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
          cellArgs,
          args?.hooks
        );
        return t;
      },
      onScheduleTick: (tick: ScheduleTick, scheduler: Scheduler) => {
        args?.hooks?.onScheduleTick(tick, scheduler);
      },
      onScheduler: (scheduler: Scheduler) => {
        args?.hooks?.onScheduler(scheduler);
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
            args?.hooks?.onTaskNotFresh(decoratorArgs.cellName, "schedule");
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
              cellArgs,
              args?.hooks
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
    meta: string;
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
    args?.hooks?.onCellPending(name);
    logger.debug("pending", name);
    events.push({
      type: "pending",
      ancestorHash: cellHashMap.get(name)?.ancestorHash || "",
      name,
      time: new Date().getTime(),
      meta: null,
    });
  });
  ee.on("fulfilled", name => {
    args?.hooks?.onCellFulfilled(name);
    logger.debug("fulfilled", name);
    events.push({
      type: "fulfilled",
      ancestorHash: cellHashMap.get(name)?.ancestorHash || "",
      name,
      time: new Date().getTime(),
      meta: null,
    });
  });
  ee.on("rejected", (name, error) => {
    args?.hooks?.onCellRejected(name);
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
    if (name) args?.hooks?.onCellObserved(name);
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
  } else {
    return await new Promise((resolve, reject) => {
      process.on("SIGINT", function() {
        console.log("SIGINT INSIDE run");
        runtime.dispose();
        process.chdir(origDir);
        resolve();
      });
    });
  }
}
