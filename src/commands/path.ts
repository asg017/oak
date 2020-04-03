import { Runtime } from "@observablehq/runtime";
import { OakCompiler } from "../oak-compile";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import { OakDB, getAndMaybeIntializeOakDB } from "../db";
import { hashFile } from "../utils";
import { createReadStream } from "fs-extra";
import { Library } from "../Library";
import Task from "../Task";
import decorator from "../decorator";
import { EOL } from "os";

const logger = pino({
  prettyPrint: true,
});

export async function oak_path(args: {
  filename: string;
  targets: readonly string[];
}): Promise<void> {
  if (args.targets.length < 0) {
  }
  const oakfilePath = fileArgument(args.filename);
  const oakDB = await getAndMaybeIntializeOakDB(oakfilePath);

  const compiler = new OakCompiler();
  const d = decorator(
    {
      onTaskUpToDate: t => t,
      onTaskCellDefinitionChanged: t => t,
      onTaskDependencyChanged: t => t,
      onTaskTargetMissing: t => t,
    },
    oakDB
  );
  const { define } = await compiler.file(oakfilePath, d, null);

  const runtime = new Runtime(new Library());

  const m1 = runtime.module(define);
  await runtime._compute();
  let error = false;
  for (const target of args.targets) {
    const result = await m1.value(target).catch(e => {
      error = true;
      process.stderr.write(
        `"${target}" may not be defined, or may have an error.`
      );
      return null;
    });
    if (result instanceof Task) {
      process.stdout.write(result.target);
      process.stdout.write(EOL);
    } else {
      error = true;
      process.stderr.write(`"${target}" is not a Task.`);
      process.stderr.write(EOL);
    }
  }
  runtime.dispose();
  if (error) process.exit(1);
}
