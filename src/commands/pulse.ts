import { Runtime } from "@observablehq/runtime";
import { OakCompiler } from "../oak-compile";
import { Library } from "../Library";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import {
  bytesToSize,
  duration,
  OakCell,
  getStat,
  CellSignature,
} from "../utils";
import Task from "../Task";
import decorator from "../decorator";
import { getAndMaybeIntializeOakDB, OakDB } from "../db";

const logger = pino();

type PulseTaskStatus = "dne" | "up" | "out";

type PulseTaskResult = {
  name: string;
  taskDeps: string[];
  target: string;
  mtime: number;
  type: string;
  bytes: number;
  status: PulseTaskStatus;
};
type PulseResults = {
  tasks: PulseTaskResult[];
};

class PulseTask {
  name: string;
  taskDeps: string[];
  target: string;
  mtime: number;
  taskType: string;
  bytes: number;
  status: PulseTaskStatus;

  constructor(
    name: string,
    taskDeps: string[],
    target: string,
    mtime: number,
    taskType: string,
    bytes: number,
    status: PulseTaskStatus
  ) {
    this.name = name;
    this.taskDeps = taskDeps;
    this.target = target;
    this.mtime = mtime;
    this.taskType = taskType;
    this.bytes = bytes;
    this.status = status;
  }
}

export async function getPulse(oakfilePath: string): Promise<PulseResults> {
  const runtime = new Runtime(
    Object.assign(new Library(), {
      shell: () => () => "shell",
      command: () => (script, args, out) => script,
      /*task: ()=>(args:{run, watch, target, })=>{
        const stat = getStat()
        const t = new Task(...args);
        return new PulseTask()
      }*/
    })
  );
  const oakDB = await getAndMaybeIntializeOakDB(oakfilePath);
  const compiler = new OakCompiler();
  const d = decorator(
    {
      onTaskUpToDate: async (t, decoratorArgs, cellDependencies) => {
        const taskType = await t.runTask();
        const taskDeps = cellDependencies
          .filter(dependency => dependency.__task)
          .map(t => t.name);
        return new PulseTask(
          decoratorArgs.cellName,
          taskDeps,
          t.target,
          t.stat.mtime.getTime(),
          taskType,
          t.stat.size,
          "up"
        );
      },
      onTaskCellDefinitionChanged: async (
        t,
        decoratorArgs,
        cellDependencies
      ) => {
        const taskType = await t.runTask();
        const taskDeps = cellDependencies
          .filter(dependency => dependency.__task)
          .map(t => t.name);
        return new PulseTask(
          decoratorArgs.cellName,
          taskDeps,
          t.target,
          t.stat.mtime.getTime(),
          taskType,
          t.stat.size,
          "out"
        );
      },
      onTaskDependencyChanged: async (t, decoratorArgs, cellDependencies) => {
        const taskType = await t.runTask();
        const taskDeps = cellDependencies
          .filter(dependency => dependency.__task)
          .map(t => t.name);
        return new PulseTask(
          decoratorArgs.cellName,
          taskDeps,
          t.target,
          t.stat.mtime.getTime(),
          taskType,
          t.stat.size,
          "out"
        );
      },
      onTaskTargetMissing: async (t, decoratorArgs, cellDependencies) => {
        const taskType = await t.runTask();
        const taskDeps = cellDependencies
          .filter(dependency => dependency.__task)
          .map(t => t.name);
        return new PulseTask(
          decoratorArgs.cellName,
          taskDeps,
          t.target,
          0,
          taskType,
          0,
          "dne"
        );
      },
    },
    oakDB
  );
  const { parseResults, define } = await compiler.file(oakfilePath, d, null);

  const parseResultsMap: Map<string, OakCell> = new Map();
  for (let cell of parseResults.module.cells) {
    if (cell.id?.name) parseResultsMap.set(cell.id?.name, cell);
  }
  const tasks: any[] = [];
  const cells: Set<string> = new Set();
  const m1 = runtime.module(define, name => {
    cells.add(name);
    return {
      pending() {},
      fulfilled(value) {
        if (value instanceof PulseTask) {
          if (parseResultsMap.has(value.name)) {
            const cell = parseResultsMap.get(value.name);
            const cellCode = cell.input.substring(cell.start, cell.end);
            tasks.push(Object.assign(value, { cellCode }));
          } else tasks.push(value);
        }
      },
      rejected(error) {
        logger.error("rejected", name, error);
      },
    };
  });
  await runtime._compute();
  await Promise.all(Array.from(cells).map(cell => m1.value(cell)));
  runtime.dispose();
  return { tasks };
}

export async function oak_pulse(args: { filename: string }): Promise<void> {
  const oakfilePath = fileArgument(args.filename);
  const pulseResult = await getPulse(oakfilePath);
  for (let task of pulseResult.tasks) {
    logger.info(
      `${task.name} - ${task.status} - ${bytesToSize(task.bytes)} - ${duration(
        new Date(task.mtime)
      )}`
    );
  }
}
