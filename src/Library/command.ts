import { execFile, ChildProcess } from "child_process";
import FileInfo from "../FileInfo";

export default function(file: string = "", args: any[] = []): ChildProcess {
  const cleanedArgs = args.map(arg => {
    if (arg instanceof FileInfo) {
      return arg.path;
    }
    return arg;
  });
  console.log(`execFile(${file}, ${JSON.stringify(cleanedArgs)})`);
  let process = execFile(file, cleanedArgs);
  return process;
}
