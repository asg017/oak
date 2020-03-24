import { OakCompiler } from "../oak-compile";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import { OakDB } from "../db";
import { hashFile } from "../utils";

const logger = pino();

export async function oak_pulse(args: {
  filename: string;
  targets: [];
}): Promise<void> {
  const oakfilePath = fileArgument(args.filename);
  const oakfileHash = hashFile(oakfilePath);

  const oakDB = new OakDB(oakfilePath);

  const compiler = new OakCompiler();
  const { parseResults, cellHashMap } = await compiler.file(
    oakfilePath,
    null,
    null
  );

  cellHashMap;
  process.stdout.write("aahhh");
}
