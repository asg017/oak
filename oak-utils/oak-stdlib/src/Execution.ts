import { WriteStream } from "fs";
import { ChildProcess } from "child_process";

export type Execution = {
  process: ChildProcess;
  outStream?: WriteStream;
  config: {
    stdout: boolean;
    stderr: boolean;
  };
};
