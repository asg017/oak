import { Runtime } from "@observablehq/runtime";
import { OakCompiler } from "../oak-compile";
import { Library } from "../Library";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import { bytesToSize, duration } from "../utils";
import decorator, {
  TaskHookDecoratorArguments,
  TaskHookTaskContext,
} from "../decorator";
import { getAndMaybeIntializeOakDB, OakDB } from "../db";
import Task from "../Task";
import { ObservableCell } from "../oak-compile-types";

const logger = pino();

type PulseTaskStatus = "dne" | "up" | "out-dep" | "out-def" | "out-upstream";

export class PulseTask extends Task {
  pulse?: {
    name: string;
    taskDeps: string[];
    target: string;
    mtime: number;
    taskType: string;
    bytes: number;
    status: PulseTaskStatus;
    cellCode: string;
  };

  constructor(params: { target: string; run: (any) => any; watch? }) {
    super(params);
    this.pulse = null;
  }

  addPulse(
    decoratorArgs: TaskHookDecoratorArguments,
    cellDependencies: any[],
    taskContext: TaskHookTaskContext,
    status: PulseTaskStatus
  ) {
    const taskType = this.getType();
    const taskDeps = cellDependencies
      .filter(d => d instanceof PulseTask)
      .map(t => t.pulse.name);
    this.pulse = {
      name: decoratorArgs.cellName,
      taskDeps,
      cellCode: decoratorArgs.cellSignature.cellContents,
      target: this.target,
      mtime: this.stat?.mtime?.getTime(),
      taskType,
      bytes: this.stat?.size,
      status,
    };
  }
  getType(): string {
    return this.run(this.target);
  }
}

export async function getPulse(
  oakfilePath: string
): Promise<{ tasks: PulseTask[] }> {
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
      onTaskUpToDate: async (
        pt: PulseTask,
        decoratorArgs,
        cellDependencies,
        taskContext
      ) => {
        pt.addPulse(decoratorArgs, cellDependencies, taskContext, "up");
        return pt;
      },
      onTaskCellDefinitionChanged: async (
        pt: PulseTask,
        decoratorArgs,
        cellDependencies,
        taskContext
      ) => {
        pt.addPulse(decoratorArgs, cellDependencies, taskContext, "out-def");
        return pt;
      },
      onTaskDependencyChanged: (
        pt: PulseTask,
        decoratorArgs,
        cellDependencies,
        taskContext
      ) => {
        pt.addPulse(decoratorArgs, cellDependencies, taskContext, "out-dep");
        return pt;
      },
      onTaskTargetMissing: async (
        pt,
        decoratorArgs,
        cellDependencies,
        taskContext
      ) => {
        pt.addPulse(decoratorArgs, cellDependencies, taskContext, "dne");
        return pt;
      },
    },
    oakDB,
    {
      check: (pt: PulseTask, decoratorArgs, cellDependencies) => {
        const taskDepsNotFresh = cellDependencies
          .filter(d => d instanceof PulseTask)
          .filter(pt => pt.pulse.status !== "up");
        return taskDepsNotFresh.length > 0;
      },
      value: async (
        pt: PulseTask,
        decoratorArgs,
        cellDependencies,
        taskContext
      ) => {
        pt.addPulse(
          decoratorArgs,
          cellDependencies,
          taskContext,
          "out-upstream"
        );
        return pt;
      },
    },
    PulseTask
  );
  const { parseResults, define } = await compiler.file(oakfilePath, d, null);

  const parseResultsMap: Map<string, ObservableCell> = new Map();
  for (let cell of parseResults.module.cells) {
    if (cell.id?.name) parseResultsMap.set(cell.id?.name, cell);
  }
  const tasks: any[] = [];
  const cells: Set<string> = new Set();
  const m1 = runtime.module(define, name => {
    cells.add(name);
    console.log(`In observer. name=${name}`);

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
  return { tasks };
}

export async function oak_pulse(args: { filename: string }): Promise<void> {
  const oakfilePath = fileArgument(args.filename);
  const pulseResult = await getPulse(oakfilePath);
  for (let { pulse } of pulseResult.tasks) {
    logger.info(
      `${pulse.name} - ${pulse.status} - ${bytesToSize(
        pulse.bytes
      )} - ${duration(new Date(pulse.mtime))}`
    );
    console.log(pulse);
  }
}
