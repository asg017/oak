import { execFile } from "child_process";
import Task from "../Task";
import { Execution } from "../Execution";
import { createWriteStream } from "fs";
import pino from "pino";

type CommandConfig = {
  stdout: boolean;
  stderr: boolean;
};
export default function(
  file: string = "",
  args: any[] = [],
  outPath?: string | Task,
  config: CommandConfig = { stdout: true, stderr: true }
): Execution {
  const cleanedArgs = args.map(arg => {
    if (arg instanceof Task) {
      return arg.target;
    }
    return arg;
  });
  outPath = outPath && (outPath instanceof Task ? outPath.target : outPath);
  const outStream = outPath && createWriteStream(outPath);

  const process = execFile(file, cleanedArgs);
  return { process, outStream, config };
}
