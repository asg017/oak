import { Runtime } from "@observablehq/runtime";
import { Library } from "./Library";
import { oakDefineFile } from "./oak-compile";
import { dirname, isAbsolute, join } from "path";
import { EventEmitter } from "events";
import yn from "yn";
import { createInterface } from "readline";
import { unlinkSync } from "fs";
import { getStat } from "./utils";
import chalk from "chalk";

const getYN = (): Promise<boolean> => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ask = () =>
    new Promise((resolve, reject) => {
      rl.question("> ", answer => {
        resolve(yn(answer));
      });
    });

  return new Promise(async (resolve, reject) => {
    while (true) {
      const resp = await ask();
      if (resp === true || resp === false) {
        resolve(resp);
        break;
      }
    }
    rl.close();
  });
};

export default async function oak_clean(args: {
  filename: string;
  targets: readonly string[];
}) {
  const targetSet = new Set(args.targets);
  const oakfilePath = isAbsolute(args.filename)
    ? args.filename
    : join(process.cwd(), args.filename);

  const runtime = new Runtime(
    Object.assign(new Library(), {
      task: () => async params => {
        const path = join(dirname(oakfilePath), params.path);
        const exists = Boolean(await getStat(path));
        return { path, exists };
      },
    })
  );
  const define = await oakDefineFile(oakfilePath, false);

  const ee = new EventEmitter();
  const cells: Set<string> = new Set();

  const m1 = runtime.module(define, name => {
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
  });
  await runtime._compute();
  const map: Map<string, { path: string; exists: boolean }> = new Map();
  await Promise.all(
    Array.from(cells).map(async cell => map.set(cell, await m1.value(cell)))
  );
  runtime.dispose();

  const existsCount = Array.from(map).reduce(
    (accum, value) => accum + (value[1].exists ? 1 : 0),
    0
  );

  if (existsCount < 1) {
    console.log(
      `No targets matched - either an empty Oakfile or the provided targets don't exist.`
    );
    return;
  }

  console.log(`Do you want to remove the following files from these recipes?`);
  console.log(``);
  Array.from(map).map(a =>
    console.log(
      a[1].exists
        ? `[${a[0]}] ${a[1].path}`
        : `${chalk.strikethrough(`[${a[0]}] ${a[1].path}`)} ${chalk.bold(
            "path not in filesystem"
          )}`
    )
  );
  console.log(``);
  console.log(`[Y] Yes, remove all ${existsCount} files.`);
  console.log(`[N/n] No, do not remove any files and exit.`);
  console.log(``);

  const choice = await getYN();
  if (!choice) {
    console.log(`Not removing any files, exiting...`);
    return;
  }
  Array.from(map).map(a => {
    if (a[1].exists) {
      console.log(`Removing ${a[0]} at ${a[1].path}...`);
      unlinkSync(a[1].path);
    }
  });
}
