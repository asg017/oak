import { execFile, ChildProcess } from "child_process";
import Task from "../Task";
import { createWriteStream } from "fs";
import * as log from "npmlog";

type CommandConfig = {
  stdout: boolean;
  stderr: boolean;
};
export default function(
  file: string = "",
  args: any[] = [],
  outPath: string | Task,
  config: CommandConfig = { stdout: true, stderr: true }
): Promise<ChildProcess> {
  const cleanedArgs = args.map(arg => {
    if (arg instanceof Task) {
      return arg.target;
    }
    return arg;
  });
  outPath = outPath instanceof Task ? outPath.target : outPath;
  const outStream = createWriteStream(outPath);

  const process = execFile(file, cleanedArgs);
  log.info(
    "oak-stdlib command",
    `execFile(${file}, ${JSON.stringify(cleanedArgs)})`
  );
  if (config.stdout) process.stdout.pipe(outStream);
  if (config.stderr) process.stderr.pipe(outStream);
  return new Promise((res, rej) => {
    process.on("close", () => res());
  });
}
