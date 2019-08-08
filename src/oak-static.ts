import { Runtime } from "@observablehq/runtime";
import { Library } from "./Library";
import { EventEmitter } from "events";
import { oakDefineFile } from "./oak-compile";
import { formatCellName, formatPath } from "./utils";
import { isAbsolute, join } from "path";

export async function oak_static(args: {
  filename: string;
  targets: readonly string[];
}) {
  const targetSet = new Set(args.targets);
  const oakfilePath = isAbsolute(args.filename)
    ? args.filename
    : join(process.cwd(), args.filename);

  const runtime = new Runtime(new Library());
  const define = await oakDefineFile(oakfilePath);
  const ee = new EventEmitter();
  const taskDefs = [];

  console.log(
    `Oak: ${formatPath(oakfilePath)}${
      targetSet.size > 0
        ? ` - targets: ${Array.from(targetSet)
            .map(formatCellName)
            .join(",")}`
        : ""
    }`
  );
  const names = [];
  const m1 = runtime.module(define, (name: string) => {
    names.push(name);
    return targetSet.size === 0 || targetSet.has(name)
      ? {
          pending() {
            ee.emit(name, "pending");
          },
          fulfilled(value) {
            ee.emit(name, "fulfilled", value);
          },
          rejected(error) {
            ee.emit(name, "rejected", error);
          }
        }
      : null;
  });
  const vals = await Promise.all(names.map(name => m1.value(name)));
}
