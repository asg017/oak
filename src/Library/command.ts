import { execFile, ChildProcess } from "child_process";
import FileInfo from "../FileInfo";
import { EventEmitter } from "events";
import { Writable } from "stream";
import { createWriteStream } from "fs";

const executeCommand = (file: string, args: string[]) => {
  const e = new EventEmitter();
  console.log(`execFile(${file}, ${JSON.stringify(args)})`);
  const process = execFile(file, args);

  // console.log(`[executeCommand] running command ${command}`);
  process.stdout.on("data", chunk => {
    e.emit("stdout", chunk);
  });
  process.stderr.on("data", chunk => {
    e.emit("stderr", chunk);
  });

  process.on("close", async code => {
    e.emit("close", process, code);
  });
  process.on("error", () => {
    e.emit("error");
  });
  return e;
};

type CommandConfig = {
  stdout: boolean;
  stderr: boolean;
};
export default function(
  file: string = "",
  args: any[] = [],
  outPath: string,
  config: CommandConfig = { stdout: true, stderr: true }
): Promise<ChildProcess> {
  const cleanedArgs = args.map(arg => {
    if (arg instanceof FileInfo) {
      return arg.path;
    }
    return arg;
  });
  const outStream = createWriteStream(outPath);

  const process = execFile(file, cleanedArgs);
  console.log(`execFile(${file}, ${JSON.stringify(cleanedArgs)})`);
  if (config.stdout) process.stdout.pipe(outStream);
  if (config.stderr) process.stderr.pipe(outStream);
  return new Promise((res, rej) => {
    process.on("close", () => res());
  });
}
