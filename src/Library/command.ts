import { execFile, ChildProcess } from "child_process";
import Task from "../Task";
import { createWriteStream } from "fs";
import * as log from "npmlog";
import { resolve } from "dns";

type CommandConfig = {
  stdout: boolean;
  stderr: boolean;
};
export default function(
  file: string = "",
  args: any[] = [],
  outPath?: string | Task,
  config: CommandConfig = { stdout: true, stderr: true }
): Promise<number> {
  const cleanedArgs = args.map(arg => {
    if (arg instanceof Task) {
      return arg.target;
    }
    return arg;
  });
  outPath = outPath && (outPath instanceof Task ? outPath.target : outPath);
  const outStream = outPath && createWriteStream(outPath);

  const process = execFile(file, cleanedArgs);
  log.info(
    "oak-stdlib command",
    `execFile(${file}, ${JSON.stringify(cleanedArgs)})`
  );
  process.stdout.on("data", chunk => {
    log.info("oak-stdlib command chunk", chunk);
    if (outStream && config.stdout) outStream.write(chunk);
  });
  process.stderr.on("data", chunk => {
    log.info("oak-stdlib command chunk", chunk);
    if (outStream && config.stderr) outStream.write(chunk);
  });

  return new Promise((resolve, reject) => {
    process.on("exit", code => {
      if (code === 0) {
        resolve(code);
      }
      reject(code);
    });
  });
}
