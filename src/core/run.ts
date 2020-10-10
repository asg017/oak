import { Runtime } from "@observablehq/runtime";
import { RunLibrary } from "../Library";
import { OakCompiler } from "../oak-compile";
import { hashFile, hashString, getStat, getSignature } from "../utils";
import { dirname, join } from "path";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import {
  mkdirsSync,
  ensureFile,
  ensureDir,
  ensureDirSync,
  remove,
} from "fs-extra";
import { OakDB, getAndMaybeIntializeOakDB } from "../db";
import Task from "../Task";
import { createWriteStream, createFileSync } from "fs-extra";
import decorator from "../decorator";

type RunTaskResults = {
  status: "succeed" | "fail";
  exitcode: number;
  pid?: number;
  finalTargetSignature?: string;
};
async function actuallyRunTask(
  cell: Task,
  logFile: string,
  currentTargetSignature: string
): Promise<RunTaskResults> {
  const runTask = cell.runTask();
  if (runTask === null || !runTask.process) {
    return { exitcode: -1, status: "fail" };
  }
  const {
    process: childProcess,
    outStream: taskOutStream,
    config: taskConfig,
  } = runTask;
  createFileSync(logFile);

  let logStream = createWriteStream(logFile);

  let logLineStream;

  childProcess.stdout.pipe(logStream);
  if (logLineStream) childProcess.stdout.pipe(logLineStream);
  if (taskOutStream && taskConfig.stdout)
    childProcess.stdout.pipe(taskOutStream);

  childProcess.stderr.pipe(logStream);
  if (logLineStream) childProcess.stderr.pipe(logLineStream);
  if (taskOutStream && taskConfig.stderr) childProcess.stderr.pipe(logStream);

  const processResult: { exitcode: number; error?: any } = await new Promise(
    (resolve, reject) => {
      // TODO handle childProccess.on('error') at some point
      childProcess.on("exit", exitcode => {
        if (exitcode !== 0) {
          return resolve({ error: "Non-zero exit code", exitcode });
        }
        resolve({ exitcode });
      });
    }
  );
  //if(logStream.writable)
  logStream.end();

  const finalTargetSignature = await getSignature(cell.target);

  return {
    status:
      currentTargetSignature === finalTargetSignature ? "fail" : "succeed",
    exitcode: processResult.exitcode,
    pid: childProcess.pid,
    finalTargetSignature,
  };
}

async function runTask(
  oakfileHash: string,
  runHash: string,
  redefined: boolean,
  cellName: string,
  oakDB: OakDB,
  logger: pino.Logger,
  cell: Task,
  logDirectory: string,
  ancestorHash: string,
  dependenciesSignature: string,
  freshStatus: string,
  currentTargetSignature: string
): Promise<number> {
  let logFile = join(logDirectory, `${cellName}.log`);

  if (redefined) {
    // if any cell was redefined from the command line,
    // then we need to save the target to a different folder.
    cell.updateBasePath(join(cell.baseTargetDir, ".oak_redefined", runHash));
    logFile = join(logDirectory, "redefined", runHash, `${cellName}.log`);
  }

  await oakDB.addLog(
    oakfileHash,
    runHash,
    cellName,
    ancestorHash,
    logFile,
    new Date().getTime()
  );

  ensureDirSync(dirname(cell.target));

  // by default, target gets deleted before run.
  if (!cell.persistTarget) {
    await remove(cell.target);
  }
  if (cell.ensureEmptyFile) {
    await ensureFile(cell.target);
  } else if (cell.ensureEmptyDirectory) {
    await ensureDir(cell.target);
  }
  const taskExecutionRowID = await oakDB.addTaskExecution(
    runHash,
    cellName,
    ancestorHash,
    dependenciesSignature,
    freshStatus,
    new Date().getTime(),
    logFile,
    cell.target
  );
  logger.info({
    type: "task-run",
    event: "start",
    task: cellName,
    logfile: logFile,
    rowid: taskExecutionRowID,
  });

  const runProcessResult = await actuallyRunTask(
    cell,
    logFile,
    currentTargetSignature
  ).catch(e => null);

  logger.info({
    type: "task-run",
    event: "end",
    task: cellName,
    logfile: logFile,
    rowid: taskExecutionRowID,
    status: runProcessResult.status,
    exitcode: runProcessResult.exitcode,
  });
  oakDB.updateTaskExection(
    Number(taskExecutionRowID),
    runProcessResult.finalTargetSignature,
    0, // runProcessStart
    0, // runProcessEnd
    runProcessResult.exitcode,
    runProcessResult.pid.toString() || ""
  );
  if (runProcessResult.status !== "succeed") throw Error("Task failed.");
  return runProcessResult.exitcode;
}

function createLogger({ name: string }) {
  const logger = pino({ name });
  return {
    info: params => {
      //logger.info()
    },
  };
}
export async function oak_run(args: {
  filename: string;
  targets: readonly string[];
  runHash?: string;
  name?: string;
  redefines?: readonly string[];
}): Promise<void> {
  const targetSet = new Set(args.targets);
  const oakfilePath = fileArgument(args.filename);
  const oakfileStat = await getStat(oakfilePath);
  const oakDB = await getAndMaybeIntializeOakDB(oakfilePath);

  const startTime = new Date();

  const library = new RunLibrary();
  const runtime = new Runtime(library);
  const compiler = new OakCompiler();

  const oakfileHash = hashFile(oakfilePath);
  const runHash = args.runHash || hashString(`${Math.random()}`);
  const logDirectory = join(
    dirname(oakfilePath),
    ".oak",
    "logs",
    `${oakfileHash}-${startTime.getTime()}`
  );
  mkdirsSync(logDirectory);

  const logger = pino({ name: "oak run" });
  logger.info({
    type: "meta",
    runHash,
    oakfilePath,
  });
  const d = decorator(
    {
      onTaskUpToDate: (t: Task, decoratorArgs) => {
        logger.info({
          type: "task-status",
          task: decoratorArgs.cellName,
          target: t.target,
          status: "fresh",
        });
        return t;
      },
      onTaskCellDefinitionChanged: async (
        t,
        decoratorArgs,
        cellArgs,
        taskContext
      ) => {
        logger.info({
          type: "task-status",
          task: decoratorArgs.cellName,
          target: t.target,
          status: "stale",
          why: "out-def",
        });
        await runTask(
          oakfileHash,
          runHash,
          false,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "out-def",
          taskContext.currentTargetSignature
        );
        return t;
      },
      onTaskDependencyChanged: async (
        t,
        decoratorArgs,
        cellArgs,
        taskContext
      ) => {
        logger.info({
          type: "task-status",
          task: decoratorArgs.cellName,
          target: t.target,
          status: "stale",
          why: "out-dep",
        });
        await runTask(
          oakfileHash,
          runHash,
          false,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "out-dep",
          taskContext.currentTargetSignature
        );
        return t;
      },
      onTaskTargetChanged: async (t, decoratorArgs, cellArgs, taskContext) => {
        logger.info({
          type: "task-status",
          task: decoratorArgs.cellName,
          target: t.target,
          status: "stale",
          why: "out-target",
        });
        await runTask(
          oakfileHash,
          runHash,
          false,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "out-target",
          taskContext.currentTargetSignature
        );
        return t;
      },
      onTaskTargetMissing: async (t, decoratorArgs, cellArgs, taskContext) => {
        logger.info({
          type: "task-status",
          task: decoratorArgs.cellName,
          target: t.target,
          status: "stale",
          why: "dne",
        });
        await runTask(
          oakfileHash,
          runHash,
          false,
          decoratorArgs.cellName,
          oakDB,
          logger,
          t,
          logDirectory,
          decoratorArgs.cellSignature.ancestorHash,
          taskContext.dependenciesSignature,
          "dne",
          taskContext.currentTargetSignature
        );
        return t;
      },
    },
    oakDB,
    args.redefines?.length > 0
      ? {
          check: () => true,
          value: async (t, decoratorArgs, cellArgs, taskContext) => {
            logger.info({
              type: "task-status",
              task: decoratorArgs.cellName,
              target: t.target,
              status: "stale",
              why: "redefine",
            });
            await runTask(
              oakfileHash,
              runHash,
              true,
              decoratorArgs.cellName,
              oakDB,
              logger,
              t,
              logDirectory,
              decoratorArgs.cellSignature.ancestorHash,
              taskContext.dependenciesSignature,
              "schedule",
              taskContext.currentTargetSignature
            );
            return t;
          },
        }
      : null
  );

  const { define, cellHashMap } = await compiler.file(oakfilePath, d, null);
  const redefineCells = args.redefines?.map(rawCell => compiler.cell(rawCell));

  // on succesful compile, add to oak db
  oakDB.registerOakfile(oakfileHash, oakfileStat.mtime.getTime(), cellHashMap);
  oakDB.addRun(
    oakfileHash,
    runHash,
    startTime.getTime(),
    JSON.stringify(args.targets)
  );

  const cells: Set<string> = new Set();
  const Inspector = (name: string) => ({
    pending() {
      logger.info({
        type: "inspector",
        cell: name,
        status: "pending",
        ancestorHash: cellHashMap.get(name)?.ancestorHash || "",
      });
    },
    fulfilled(value) {
      logger.info({
        type: "inspector",
        cell: name,
        status: "fulfilled",
        ancestorHash: cellHashMap.get(name)?.ancestorHash || "",
      });
    },
    rejected(error) {
      logger.info({
        type: "inspector",
        cell: name,
        status: "rejected",
        error,
        ancestorHash: cellHashMap.get(name)?.ancestorHash || "",
      });
    },
  });

  const origDir = process.cwd();
  process.chdir(dirname(oakfilePath));

  const observer = name => {
    // log when named cells are observed
    if (name) {
      logger.info({
        type: "inspector",
        cell: name,
        status: "observed",
        ancestorHash: cellHashMap.get(name)?.ancestorHash || "",
      });
    }

    // it no targets, then we want to observe everything with a name.
    if (targetSet.size === 0 && name) {
      cells.add(name);
      return Inspector(name);
    }
    // if targets, then only if name is inside
    if (targetSet.has(name)) {
      cells.add(name);
      return Inspector(name);
    }
  };
  const m1 = runtime.module(define, observer);

  if (args.redefines?.length > 0) {
    for (let { redefine } of redefineCells) {
      redefine(m1, observer);
    }
  }
  await runtime._compute();
  await Promise.all(
    Array.from(cells).map(cell => m1.value(cell).catch(e => null))
  );
  runtime.dispose();
  process.chdir(origDir);
}
