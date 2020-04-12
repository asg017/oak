import { Runtime } from "@observablehq/runtime";
import { OakCompiler } from "../oak-compile";
import { Library } from "../Library";
import pino from "pino";
import { CellSignature } from "../utils";
import decorator, {
  TaskHookDecoratorArguments,
  TaskHookTaskContext,
} from "../decorator";
import { getAndMaybeIntializeOakDB } from "../db";
import Task from "../Task";

const logger = pino({});

type PulseTaskStatus =
  | "dne"
  | "up"
  | "out-dep"
  | "out-def"
  | "out-upstream"
  | "out-target";

export class PulseTask extends Task {
  pulse?: {
    name: string;
    modulePath: string;
    oakfilePath: string;
    importId: string;
    taskDeps: {
      name: string;
      modulePath: string;
      oakfilePath: string;
      importId: string;
    }[];
    target: string;
    mtime: number;
    taskType: string;
    bytes: number;
    status: PulseTaskStatus;
    cellCode: string;
  };

  constructor(params) {
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
      .map(t => ({
        name: t.pulse.name,
        modulePath: t.pulse.modulePath,
        oakfilePath: t.pulse.oakfilePath,
        importId: t.pulse.importId,
      }));
    this.pulse = {
      name: decoratorArgs.cellName,
      modulePath: decoratorArgs.baseModuleDir,
      oakfilePath: decoratorArgs.oakfilePath,
      importId: decoratorArgs.importId,
      taskDeps,
      cellCode: decoratorArgs.cellSignature.cellContents,
      target: this.target,
      mtime: 0, // this.stat?.mtime?.getTime(),
      taskType,
      bytes: 0, //this.stat?.size || 0,
      status,
    };
  }
  getType(): string {
    return this.run(this.target);
  }
}

export async function getPulse(
  oakfilePath: string
): Promise<{ tasks: { task: PulseTask; name: string }[]; imports: any }> {
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
      onTaskTargetChanged: (
        pt: PulseTask,
        decoratorArgs,
        cellDependencies,
        taskContext
      ) => {
        pt.addPulse(decoratorArgs, cellDependencies, taskContext, "out-target");
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
    }
  );
  const { cellHashMap, define } = await compiler.file(oakfilePath, d, null);

  const tasks: {
    task: PulseTask;
    name: string;
    signature: CellSignature;
  }[] = [];
  const cells: Set<string> = new Set();
  const m1 = runtime.module(define, name => {
    cells.add(name);

    return {
      pending() {},
      fulfilled(value) {
        if (value instanceof PulseTask) {
          tasks.push({ task: value, name, signature: cellHashMap.get(name) });
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
  const imports = Array.from(cellHashMap.values()).filter(
    d => d.type === "import"
  );
  const importReferences = [];
  for (let { task, name } of tasks) {
    for (let { name, importId } of task.pulse?.taskDeps) {
      if (importId) {
        importReferences.push({ importId, name });
      }
    }
  }
  return { tasks, imports };
}