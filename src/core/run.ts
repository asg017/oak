import { Runtime } from "@observablehq/runtime";
import { RunLibrary } from "../Library";
import { OakCompiler } from "../oak-compile";
import {
  formatCellName,
  formatPath,
  hashFile,
  hashString,
  getStat,
  getSignature,
} from "../utils";
import { dirname, join, isAbsolute, basename } from "path";
import { EventEmitter } from "events";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import {
  mkdirsSync,
  ensureFile,
  ensureDir,
  createReadStream,
  ensureDirSync,
  remove,
} from "fs-extra";
import { OakDB, getAndMaybeIntializeOakDB } from "../db";
import Task from "../Task";
import { createWriteStream, createFileSync } from "fs-extra";
import decorator from "../decorator";
import untildify from "untildify";
import split2 from "split2";

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
  cellArgs: any[],
  hooks?: OakRunHooks
): Promise<number> {
  let logFile = join(logDirectory, `${cellName}.log`);

  // If any of  the task's upstream tasks dependencies were from stdin,
  // then we need to save the target to a different folder.

  // picking the first one should be safe, since only 1 Task should be stdin
  const upstreamStdinTask = cellArgs.find(
    dep => dep instanceof Task && (dep.stdin || dep.upstreamStdin)
  );
  if (upstreamStdinTask) {
    cell.upstreamStdin = true;
    cell.upstreamStdinId = upstreamStdinTask.upstreamStdinId;
    cell.updateBasePath(
      join(cell.baseTargetDir, ".oak_stdin", cell.upstreamStdinId)
    );
    // no need to update logFile here, it can log like normal.
  }

  // If any of  the task's upstream tasks dependencies were overriddeb,
  // then we need to save the target to a different folder.

  // picking the first one should be safe, since only 1 Task should be stdin
  const upstreamOverriddenTask = cellArgs.find(
    dep => dep instanceof Task && dep.upstreamOverridden
  );
  if (upstreamOverriddenTask) {
    cell.upstreamOverridden = true;
    cell.upstreamOverriddenId = upstreamOverriddenTask.upstreamOverriddenId;
    cell.updateBasePath(
      join(cell.baseTargetDir, ".oak_override", cell.upstreamOverriddenId)
    );
    // no need to update logFile here, it can log like normal.
  }

  if (redefined) {
    // if any cell was redefined from the command line,
    // then we need to save the target to a different folder.
    cell.updateBasePath(join(cell.baseTargetDir, ".oak_redefined", runHash));
    logFile = join(logDirectory, "redefined", runHash, `${cellName}.log`);
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
  hooks?.onTaskExectionStart(cellName, cell.target);
  const runProcessStart = new Date().getTime();
  const {
    process: childProcess,
    outStream: taskOutStream,
    config: taskConfig,
  } = cell.runTask();
  createFileSync(logFile);
  const runProcessPID = childProcess.pid;
  const logStream = createWriteStream(logFile);
  let logLineStream;
  if (hooks?.onTaskExecutionLog) {
    logLineStream = split2();
    hooks?.onTaskExecutionLog(cellName, logLineStream);
  }

  childProcess.stdout.pipe(logStream);
  //if (logLineStream) childProcess.stdout.pipe(logLineStream);
  //if (taskOutStream && taskConfig.stdout)
  //  childProcess.stdout.pipe(taskOutStream);

  childProcess.stderr.pipe(logStream);
  if (logLineStream) childProcess.stderr.pipe(logLineStream);
  if (taskOutStream && taskConfig.stderr) childProcess.stderr.pipe(logStream);

  const { runExitCode, runProcessEnd } = await new Promise(
    (resolve, reject) => {
      childProcess.on("error", err => {
        //logger.error(`childProcess error event.`);
        logStream.end();
        reject(err);
      });
      childProcess.on("exit", code => {
        logStream.end();
        if (code !== 0) {
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
  onTaskExecutionLog?(cellName: string, lineStream: ReadableStream);
  onTaskExectionEnd(cellName: string);
  onTaskNotFresh(cellName: string, reason: string);
  onTaskFresh(cellName: string, cellTarget: string);
  onCellObserved(cellName: string);
  onCellPending(cellName: string);
  onCellFulfilled(cellName: string);
  onCellRejected(cellName: string);
};

export function defaultHookEmitter(ee: EventEmitter) {
  return {
    onTaskExectionStart: (cellName: string, cellTarget) =>
      ee.emit("te-start", cellName, cellTarget),
    onTaskExectionEnd: (cellName: string) => ee.emit("te-end", cellName),
    onTaskExecutionLog: (cellName: string, stream: ReadableStream) =>
      ee.emit("te-log", cellName, stream),
    onTaskNotFresh: (cellName: string, reason: string) =>
      ee.emit("t-nf", cellName, reason),
    onTaskFresh: (cellName: string, cellTarget: string) =>
      ee.emit("t-f", cellName, cellTarget),
    onCellObserved: (cellName: string) => ee.emit("co", cellName),
    onCellPending: (cellName: string) => ee.emit("cp", cellName),
    onCellFulfilled: (cellName: string) => ee.emit("cf", cellName),
    onCellRejected: (cellName: string) => ee.emit("cr", cellName),
  };
}

export async function oak_run(args: {
  filename: string;
  targets: readonly string[];
  name?: string;
  stdin?: string;
  stdout?: string;
  overrides?: readonly string[];
  redefines?: readonly string[];
  hooks?: OakRunHooks;
}): Promise<void> {
  if (args.targets.length > 0 && args.stdout)
    throw Error('Only "targets" or "stdout" can be provided, not both.');
  if (args.stdin && args.overrides?.length > 0)
    throw Error('Only "stdin" or "override" can be provided, not both.');
  if (args.stdin && args.redefines?.length > 0)
    throw Error('Only "stdin" or "redefine" can be provided, not both.');
  if (args.overrides?.length > 0 && args.redefines?.length > 0)
    throw Error('Only "override" or "redefine" can be provided, not both.');

  // if we are doing stdout, then only build up to that.
  if (args.stdout) {
    args.targets = [args.stdout];
  }

  const targetSet = new Set(args.targets);
  const oakfilePath = fileArgument(args.filename);
  const oakfileStat = await getStat(oakfilePath);
  const oakDB = await getAndMaybeIntializeOakDB(oakfilePath);

  const startTime = new Date();

  const library = new RunLibrary();
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
          false,
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
          false,
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
          )} - out of date because the target has changed since last run.`
        );
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
          false,
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
    },
    oakDB,
    args.redefines?.length > 0
      ? {
          check: () => true,
          value: async (t, decoratorArgs, cellArgs, taskContext) => {
            args?.hooks?.onTaskNotFresh(decoratorArgs.cellName, "redefine");
            logger.info(
              "oak-run decorator",
              `${formatPath(t.target)} - Defineded, running task...`
            );
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
              cellArgs,
              args?.hooks
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

  const events: {
    ancestorHash: string;
    type: string;
    name: string;
    time: number;
    meta: string;
  }[] = [];
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
  const Inspector = (name: string) => ({
    pending() {
      ee.emit("pending", name);
    },
    fulfilled(value) {
      ee.emit("fulfilled", name, value);
    },
    rejected(error) {
      ee.emit("rejected", name, error);
    },
  });

  let stdinTarget;
  if (args.stdin) {
    stdinTarget = join(
      dirname(oakfilePath),
      "oak_data",
      ".oak_stdin",
      runHash,
      ".oak_stdin"
    );
    ensureDirSync(dirname(stdinTarget));
    process.stdin.pipe(createWriteStream(stdinTarget));
    await new Promise((resolve, reject) => {
      process.stdin.on("end", resolve);
      process.stdin.on("error", reject);
    });
  }
  const origDir = process.cwd();
  process.chdir(dirname(oakfilePath));

  const observer = name => {
    // call the hook on all cells
    if (name) args?.hooks?.onCellObserved(name);

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
  if (args.stdin) {
    const stdinTask = new Task({ target: ".oak_stdin", run: () => {} });
    stdinTask.updateBasePath(dirname(stdinTarget));
    stdinTask.stdin = true;
    stdinTask.upstreamStdin = true;
    stdinTask.upstreamStdinId = runHash;
    m1.redefine(args.stdin, stdinTask);
  }
  if (args.overrides?.length > 0) {
    for (const override of args.overrides) {
      const colon = override.indexOf(":");
      if (colon < 0) {
        throw Error(`"override" usage: "cellName:/path/to/file"`);
      }
      const cellName = override.substring(0, colon);
      let path = override.substring(colon + 1);
      path = untildify(path);
      if (!isAbsolute(path)) {
        path = join(origDir, path);
      }

      const overrideTask = new Task({
        target: basename(path),
        run: () => {},
      });
      overrideTask.updateBasePath(dirname(path));
      overrideTask.upstreamOverridden = true;
      overrideTask.upstreamOverriddenId = runHash;
      m1.redefine(cellName, overrideTask);
    }
  }
  await runtime._compute();
  await Promise.all(Array.from(cells).map(cell => m1.value(cell)));
  // if stdout was specified, query for it, get file location.
  if (args.stdout) {
    const task = await m1.value(args.stdout).catch(() => null);
    if (!task) {
      console.error(
        `stdout argument "${args.stdout}" doesn't appear to be a cell in the Oakfile.`
      );
    } else if (!(task instanceof Task)) {
      console.error(
        `stdout argument "${args.stdout}" doesn't appear to be a Task cell in the Oakfile.`
      );
    } else {
      const readStream = createReadStream(task.target);
      readStream.pipe(process.stdout);
      await new Promise((resolve, reject) => {
        readStream.on("end", resolve);
        readStream.on("error", reject);
      });
    }
  }
  runtime.dispose();
  process.chdir(origDir);
  oakDB.addEvents(runHash, events);
}
