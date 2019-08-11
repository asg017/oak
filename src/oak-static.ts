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
  const cells: Set<string> = new Set();
  const m1 = runtime.module(define, (name: string) => {
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
        }
      };
    }
    return null;
  });
  await new Promise((resolve, reject) => {
    ee.on("fulfilled", (name, val) => {
      cells.delete(name);
      if (cells.size === 0) {
        resolve();
      }
    });
  });
}
