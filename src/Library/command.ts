import { execFile, ChildProcess } from "child_process";
import FileInfo from "../FileInfo";
import { createWriteStream } from "fs";

type CommandConfig = {
  stdout: boolean;
  stderr: boolean;
};
export default function(
  file: string = "",
  args: any[] = [],
  outPath: string | FileInfo,
  config: CommandConfig = { stdout: true, stderr: true }
): Promise<ChildProcess> {
  const cleanedArgs = args.map(arg => {
    if (arg instanceof FileInfo) {
      return arg.path;
    }
    return arg;
  });
  outPath = outPath instanceof FileInfo ? outPath.path : outPath;
  const outStream = createWriteStream(outPath);

  const process = execFile(file, cleanedArgs);
  console.log(`execFile(${file}, ${JSON.stringify(cleanedArgs)})`);
  if (config.stdout) process.stdout.pipe(outStream);
  if (config.stderr) process.stderr.pipe(outStream);
  return new Promise((res, rej) => {
    process.on("close", () => res());
  });
}