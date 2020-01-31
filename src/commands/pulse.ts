import { Runtime } from "@observablehq/runtime";
import { OakCompiler } from "../oak-compile";
import { Library } from "../Library";
import { default as pulseCellDecorator } from "../decorators/pulse";
import * as log from "npmlog";
import { fileArgument } from "../cli-utils";

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
export async function oak_pulse(args: {
  filename: string;
}): Promise<PulseResults> {
  const oakfilePath = fileArgument(args.filename);

  const runtime = new Runtime(
    Object.assign(new Library(), {
      shell: () => () => "shell",
      command: () => (script, args, out) => script,
    })
  );
  const compiler = new OakCompiler();
  const define = await compiler.file(oakfilePath, pulseCellDecorator, null);

  const tasks: any[] = [];
  const cells: Set<string> = new Set();
  const m1 = runtime.module(define, name => {
    cells.add(name);
    return {
      pending() {},
      fulfilled(value) {
        if (value && value.__task) tasks.push(value);
      },
      rejected(error) {
        log.error("rejected", name, error);
      },
    };
  });
  await runtime._compute();
  await Promise.all(Array.from(cells).map(cell => m1.value(cell)));
  runtime.dispose();
  return { tasks };
}
