import { Runtime } from "@observablehq/runtime";
import { Library } from "./Library";
import { OakCompiler } from "./oak-compile";
import { formatCellName, formatPath } from "./utils";
import { isAbsolute, join, dirname } from "path";
import { EventEmitter } from "events";
import { default as runCellDecorator } from "./decorators/run";
import * as log from "npmlog";

export async function oak_run({
  filename,
  targets,
  overrides = [],
}: {
  filename: string;
  targets: readonly string[];
  overrides?: readonly string[];
}): Promise<void> {
  const targetSet = new Set(targets);
  const oakfilePath = isAbsolute(filename)
    ? filename
    : join(process.cwd(), filename);
  const compiler = new OakCompiler();

  const overrideCells = await Promise.all(
    overrides.map(async (rawCell: string) => {
      return compiler.cell(rawCell, oakfilePath, runCellDecorator, null);
    })
  );

  const runtime = new Runtime(new Library());
  const define = await compiler.file(oakfilePath, runCellDecorator, null);

  const origDir = process.cwd();
  process.chdir(dirname(oakfilePath));

  log.info(
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
  ee.on("pending", name => log.verbose("pending", name));
  ee.on("fulfilled", name => log.verbose("fulfilled", name));
  ee.on("rejected", name => log.verbose("rejected", name));

  const cells: Set<string> = new Set();
  const observer = name => {
    if (targetSet.size === 0 || targetSet.has(name)) {
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
    }
  };
  const m1 = runtime.module(define, observer);
  overrideCells.map(({ redefine }) => {
    redefine(m1, observer);
  });
  await runtime._compute();
  await Promise.all(Array.from(cells).map(cell => m1.value(cell)));
  runtime.dispose();
  process.chdir(origDir);
}
