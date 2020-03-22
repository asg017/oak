import { Runtime } from "@observablehq/runtime";
import { Library } from "../Library";
import { OakCompiler } from "../oak-compile";
import {
  formatCellName,
  formatPath,
  hashFile,
  hashString,
  getStat,
} from "../utils";
import { dirname, join } from "path";
import { EventEmitter } from "events";
import { default as runCellDecorator } from "../decorators/run";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import { writeFileSync, mkdirsSync } from "fs-extra";
import { OakDB } from "../db";

export async function oak_run(args: {
  filename: string;
  targets: readonly string[];
}): Promise<void> {
  const logger = pino({ name: "oak run", prettyPrint: true });

  const targetSet = new Set(args.targets);
  const oakfilePath = fileArgument(args.filename);
  const oakfileStat = await getStat(oakfilePath);
  const oakDB = new OakDB(oakfilePath);

  const startTime = new Date();

  const runtime = new Runtime(new Library());
  const compiler = new OakCompiler();
  const oakfileHash = hashFile(oakfilePath);
  const runHash = hashString(`${startTime.getTime()}`);
  const logDirectory = join(
    dirname(oakfilePath),
    ".oak",
    "logs",
    `${oakfileHash}-${startTime.getTime()}`
  );
  mkdirsSync(logDirectory);

  const { define, parseResults } = await compiler.file(
    oakfilePath,
    runCellDecorator(runHash, logger, logDirectory, oakDB),
    null
  );

  // on succesful compile, add to oak db
  await oakDB.registerOakfile(
    oakfileHash,
    oakfileStat.mtime.getTime(),
    parseResults
  );
  await oakDB.addRun(
    oakfileHash,
    runHash,
    startTime.getTime(),
    JSON.stringify(args.targets)
  );

  const events = [];
  const origDir = process.cwd();
  process.chdir(dirname(oakfilePath));

  logger.info(
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
  ee.on("pending", name => logger.debug("pending", name));
  ee.on("fulfilled", name => logger.debug("fulfilled", name));
  ee.on("rejected", name => logger.error("rejected", name));

  const cells: Set<string> = new Set();
  const m1 = runtime.module(define, name => {
    if (targetSet.size === 0 || targetSet.has(name)) {
      cells.add(name);
      return {
        pending() {
          events.push({ type: "pending", name, time: new Date().getTime() });
          ee.emit("pending", name);
        },
        fulfilled(value) {
          events.push({ type: "fulfilled", name, time: new Date().getTime() });
          ee.emit("fulfilled", name, value);
        },
        rejected(error) {
          events.push({ type: "rejected", name, time: new Date().getTime() });
          ee.emit("rejected", name, error);
        },
      };
    }
  });
  await runtime._compute();
  await Promise.all(Array.from(cells).map(cell => m1.value(cell)));
  runtime.dispose();
  process.chdir(origDir);
  // writeFileSync(join(runDirectory, "events.json"), events);
}
