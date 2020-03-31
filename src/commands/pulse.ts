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
import decorator from "../decorator";
import { getAndMaybeIntializeOakDB, OakDB } from "../db";
import { Stats } from "fs-extra";
import { join } from "path";
import TaskGraphSection from "./dash/dash-frontend/components/TaskGraphSection";

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
  target: string;
  stat: Stats | null;
  run: (any) => any;
  watch: string[];

  pulse?: {
    name: string;
    taskDeps: string[];
    target: string;
    mtime: number;
    taskType: string;
    bytes: number;
    status: PulseTaskStatus;
  };

  constructor(params: { target: string; run: (any) => any; watch? }) {
    let { target, run, watch = [] } = params;
    watch = Array.isArray(watch) ? watch : [watch];

    this.target = target;
    this.stat = null;
    this.run = run;
    this.watch = watch;
    this.pulse = null;
  }

  addPulse(
    name: string,
    taskDeps: string[],
    target: string,
    mtime: number,
    taskType: string,
    bytes: number,
    status: PulseTaskStatus
  ) {
    this.pulse = { name, taskDeps, target, mtime, taskType, bytes, status };
  }
  absPath(basePath: string) {
    return join(basePath, this.target);
  }
  async updateBasePath(newBasePath: string) {
    this.target = this.absPath(newBasePath);
    this.stat = await getStat(this.target);
  }
  runTask() {
    return this.run(this.target);
  }
}

export async function getPulse(oakfilePath: string): Promise<PulseResults> {
  const runtime = new Runtime(
    Object.assign(new Library(), {
      shell: () => () => "shell",
      command: () => (script, args, out) => script,
      Task: () => PulseTask,
    })
  );
  const oakDB = await getAndMaybeIntializeOakDB(oakfilePath);
  const compiler = new OakCompiler();
  const d = decorator(
    {
      onTaskUpToDate: async (pt, decoratorArgs, cellDependencies) => {
        const taskType = await pt.runTask();
        const taskDeps = cellDependencies
          .filter(d => d instanceof PulseTask)
          .map(t => t.pulse.name);
        pt.addPulse(
          decoratorArgs.cellName,
          taskDeps,
          pt.target,
          pt.stat.mtime.getTime(),
          taskType,
          pt.stat.size,
          "up"
        );
        return pt;
      },
      onTaskCellDefinitionChanged: async (
        pt,
        decoratorArgs,
        cellDependencies
      ) => {
        const taskType = await pt.runTask();
        const taskDeps = cellDependencies
          .filter(d => d instanceof PulseTask)
          .map(t => t.pulse.name);
        pt.addPulse(
          decoratorArgs.cellName,
          taskDeps,
          pt.target,
          pt.stat.mtime.getTime(),
          taskType,
          pt.stat.size,
          "out"
        );
        return pt;
      },
      onTaskDependencyChanged: async (pt, decoratorArgs, cellDependencies) => {
        const taskType = await pt.runTask();
        console.log(cellDependencies);

        const taskDeps = cellDependencies
          .filter(d => d instanceof PulseTask)
          .map(t => t.pulse.name);
        pt.addPulse(
          decoratorArgs.cellName,
          taskDeps,
          pt.target,
          pt.stat.mtime.getTime(),
          taskType,
          pt.stat.size,
          "out"
        );
        return pt;
      },
      onTaskTargetMissing: async (pt, decoratorArgs, cellDependencies) => {
        const taskType = await pt.runTask();
        const taskDeps = cellDependencies
          .filter(d => d instanceof PulseTask)
          .map(t => t.pulse.name);
        pt.addPulse(
          decoratorArgs.cellName,
          taskDeps,
          pt.target,
          0,
          taskType,
          0,
          "dne"
        );
        return pt;
      },
    },
    oakDB,
    PulseTask
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
          tasks.push(value);
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
  return {
    tasks: tasks
      .map(t => t.pulse)
      .map(pulse => {
        const cell = parseResultsMap.get(pulse.name);
        const cellCode = cell.input.substring(cell.start, cell.end);
        return Object.assign(pulse, { cellCode });
      }),
  };
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
