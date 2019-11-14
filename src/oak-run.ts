import { Runtime } from "@observablehq/runtime";
import { Library } from "./Library";
import { oakDefineFile } from "./oak-compile";
import { formatCellName, formatPath, parseOakfile } from "./utils";
import { isAbsolute, join, dirname } from "path";
import { EventEmitter } from "events";
import { default as runCellDecorator } from "./decorators/run";
import logUpdate from "log-update";
import { Observable } from "rxjs";

function getPossibleCells(cells: any) {
  let possibleCells = [];
  cells.map(cell => {
    if (cell.id && cell.id.name) {
      possibleCells.push(cell.id.name);
    } else if (cell.body.type === "ImportDeclaration") {
      possibleCells = possibleCells.concat(
        cell.body.specifiers.map(spec => spec.local.name)
      );
    }
  });
  return possibleCells;
}
export async function oak_run(args: {
  filename: string;
  targets: readonly string[];
}): Promise<void> {
  const targetSet = new Set(args.targets);
  const oakfilePath = isAbsolute(args.filename)
    ? args.filename
    : join(process.cwd(), args.filename);

  const runtime = new Runtime(new Library());
  const define = await oakDefineFile(oakfilePath, null, runCellDecorator);
  const parseResults = await parseOakfile(oakfilePath).catch(err => {
    throw Error(`Error parsing Oakfile at ${oakfilePath} ${err}`);
  });
  const possibleCells = getPossibleCells(parseResults.module.cells);
  const listrTasks = [];
  const ee = new EventEmitter();

  Array.from(possibleCells).map(possibleCell => {
    listrTasks.push({
      title: possibleCell,
      task: () =>
        new Observable(observer => {
          observer.next(possibleCell + " pending");
          ee.on(possibleCell, (status, value) => {
            console.log(`ee on ${possibleCell} ${status}`);
            if (status === "pending") observer.next(status);
            else if (status === "fulfilled") observer.complete();
            else if (status === "rejected") observer.error(value);
          });
        }),
    });
  });

  const origDir = process.cwd();
  process.chdir(dirname(oakfilePath));

  console.log(
    `Oak: ${formatPath(oakfilePath)}${
      targetSet.size > 0
        ? ` - targets: ${Array.from(targetSet)
            .map(formatCellName)
            .join(",")}`
        : ""
    }`
  );
  const cellStatus: Map<string, string | null> = new Map();
  function updateStatus() {
    const status = Array.from(cellStatus)
      .map(([key, value]) => `${key} - ${value}`)
      .join("\n");
    logUpdate(status);
  }
  const cells: Set<string> = new Set();
  const m1 = runtime.module(define, name => {
    if (targetSet.size === 0 || targetSet.has(name)) {
      cells.add(name);
      cellStatus.set(name, null);
      return {
        pending() {
          ee.emit(name, "pending");
          cellStatus.set(name, "pending");
          updateStatus();
        },
        fulfilled(value) {
          cellStatus.set(name, "fulfilled");
          ee.emit(name, "fulfilled", value);
          updateStatus();
        },
        rejected(error) {
          cellStatus.set(name, "rejected");
          ee.emit(name, "rejected", error);
          updateStatus();
        },
      };
    }
  });

  await runtime._compute();
  await Promise.all(Array.from(cells).map(cell => m1.value(cell)));
  runtime.dispose();
  process.chdir(origDir);
}
