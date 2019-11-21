import { Runtime } from "@observablehq/runtime";
import { Library } from "./Library";
import { OakCompiler } from "./oak-compile";
import { dirname, join } from "path";
import { EventEmitter } from "events";
import yn from "yn";
import { createInterface } from "readline";
import { unlinkSync } from "fs";
import { getStat } from "./utils";
import chalk from "chalk";
import { fileArgument } from "./cli-utils";

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

type ExistMap = Map<string, { target: string; exists: boolean }>;

function removeFiles(map: ExistMap) {
  Array.from(map).map(a => {
    if (a[1].exists) {
      console.log(`Removing ${a[0]} at ${a[1].target}...`);
      unlinkSync(a[1].target);
    }
  });
  return;
}

export default async function oak_clean(args: {
  filename: string;
  force: boolean;
  targets: readonly string[];
}) {
  const targetSet = new Set(args.targets);
  const oakfilePath = fileArgument(args.filename);

  const overriddenTaskSymbol = Symbol("task");
  const runtime = new Runtime(
    Object.assign(new Library(), {
      task: () => async params => {
        const target = join(dirname(oakfilePath), params.target);
        console.log(target);
        const exists = Boolean(await getStat(target));
        return { target, exists, __type: overriddenTaskSymbol };
      },
    })
  );
  const compiler = new OakCompiler();
  const define = await compiler.file(oakfilePath);

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
  const map: ExistMap = new Map();
  await Promise.all(
    Array.from(cells).map(async cell => {
      // only try and clean cells that are defined with the "task" override above
      const value = await m1.value(cell);
      if (value.__type === overriddenTaskSymbol) map.set(cell, value);
    })
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
  if (args.force) {
    removeFiles(map);
    return;
  }

  console.log(`Do you want to remove the following files from these recipes?`);
  console.log(``);
  Array.from(map).map(a =>
    console.log(
      a[1].exists
        ? `[${a[0]}] ${a[1].target}`
        : `${chalk.strikethrough(`[${a[0]}] ${a[1].target}`)} ${chalk.bold(
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
  removeFiles(map);
}
