import { OakCompiler } from "../oak-compile";
import pino from "pino";
import { fileArgument } from "../cli-utils";
import { getAndMaybeIntializeOakDB } from "../db";
import { hashFile } from "../utils";
import { createReadStream } from "fs-extra";

const logger = pino({
  prettyPrint: true,
});

export async function oak_logs(args: {
  filename: string;
  targets: readonly string[];
}): Promise<void> {
  if (args.targets.length < 0) {
  }
  const oakfilePath = fileArgument(args.filename);
  const oakfileHash = hashFile(oakfilePath);

  const oakDB = getAndMaybeIntializeOakDB(oakfilePath);

  const compiler = new OakCompiler();
  const { cellHashMap } = await compiler.file(oakfilePath, null, null);

  for (const target of args.targets) {
    const cellSigature = cellHashMap.get(target);
    const result = await oakDB.getLog(target);
    if (!result) {
      logger.error(`No logs found for ${target}.`);
      continue;
    }
    const { path, oakfile, cellAncestorHash } = result;
    if (
      oakfileHash !== oakfile ||
      cellAncestorHash !== cellSigature.ancestorHash
    )
      logger.warn(
        `WARNING (${target}): This log is from a previous Oakfile version. Running oak run may update the task's log.`
      );
    await new Promise((resolve, reject) => {
      const s = createReadStream(path);
      s.pipe(process.stdout);
      s.on("end", resolve);
      s.on("error", reject);
    });
  }
}
