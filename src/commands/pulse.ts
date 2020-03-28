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

function pulseCellDecorator(
  cellFunction: (...args: any) => any,
  cellName: string,
  cellReferences: string[],
  cellHashMap: Map<string, CellSignature>,
  baseModuleDir: string
): (...any) => any {
  return async function(...dependencies) {
    let taskDependents: number[] = [];
    dependencies.map((dependency, i) => {
      if (dependency.__task) {
        taskDependents.push(i);
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

      // assuming that the library passed into this runtime
      // isnt running the tasks, but actually returning the "type" of tasks
      const taskType = await currCell.runTask();
      if (currCell.stat === null) {
        return {
          __task: true,
          name: cellName,
          taskDeps: taskDependents.map(i => cellReferences[i]),
          target: currCell.target,
          mtime: 0,
          type: taskType,
          bytes: 0,
          status: "dne",
        };
      }

      const outOfDateTaskDependencies = taskDependents.filter(
        i =>
          currCell.stat.mtime.getTime() <= dependencies[i].mtime ||
          dependencies[i].status !== "up"
      );
      const outOfDateWatchFiles = watchStats.filter(
        ({ stat }) => currCell.stat.mtime.getTime() <= stat.mtime
      );
      if (
        outOfDateTaskDependencies.length > 0 ||
        outOfDateWatchFiles.length > 0
      ) {
        return {
          __task: true,
          name: cellName,
          taskDeps: taskDependents.map(i => cellReferences[i]),
          target: currCell.target,
          mtime: currCell.stat.mtime.getTime(),
          type: taskType,
          bytes: currCell.stat.size,
          status: "out",
        };
      }
      return {
        __task: true,
        name: cellName,
        taskDeps: taskDependents.map(i => cellReferences[i]),
        target: currCell.target,
        mtime: currCell.stat.mtime.getTime(),
        type: taskType,
        bytes: currCell.stat.size,
        status: "up",
      };
    }
    return currCell;
  };
}

export async function getPulse(oakfilePath: string): Promise<PulseResults> {
  const runtime = new Runtime(
    Object.assign(new Library(), {
      shell: () => () => "shell",
      command: () => (script, args, out) => script,
    })
  );
  const compiler = new OakCompiler();
  const { parseResults, define } = await compiler.file(
    oakfilePath,
    pulseCellDecorator,
    null
  );
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
        if (value && value.__task) {
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
