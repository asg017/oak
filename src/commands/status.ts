import { Runtime } from "@observablehq/runtime";
import { Library } from "../Library";
import { OakCompiler } from "../oak-compile";
import { dirname } from "path";
import { EventEmitter } from "events";
import { default as statusCellDecorator } from "../decorators/status";
import * as log from "npmlog";
import { fileArgument } from "../cli-utils";

export async function oak_status(args: { filename: string }): Promise<void> {
  const oakfilePath = fileArgument(args.filename);

  const runtime = new Runtime(new Library());
  const compiler = new OakCompiler();
  const define = await compiler.file(oakfilePath, statusCellDecorator, null);

  const origDir = process.cwd();
  process.chdir(dirname(oakfilePath));

  const ee = new EventEmitter();
  ee.on("pending", name => log.verbose("pending", name));
  ee.on("fulfilled", name => log.verbose("fulfilled", name));
  ee.on("rejected", name => log.error("rejected", name));

  const cells: Set<string> = new Set();
  const m1 = runtime.module(define, name => {
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
  });
  await runtime._compute();
  await Promise.all(Array.from(cells).map(cell => m1.value(cell)));
  runtime.dispose();
  process.chdir(origDir);
}
