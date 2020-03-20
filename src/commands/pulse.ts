import { Runtime } from "@observablehq/runtime";
import { OakCompiler } from "../oak-compile";
import { Library } from "../Library";
import { default as pulseCellDecorator } from "../decorators/pulse";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import { bytesToSize, duration, OakCell } from "../utils";

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
