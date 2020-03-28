import { WriteStream } from "fs-extra";
import { ChildProcess } from "child_process";

export type Execution = {
  process: ChildProcess;
  outStream?: WriteStream;
  config: {
    stdout: boolean;
    stderr: boolean;
  };
};
