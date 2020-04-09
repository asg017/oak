import { Stats, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { getStat } from "./utils";
import { Execution } from "./Execution";

type WatchArg = string | string[];

type TaskParams = {
  target: string;
  run: (any) => any;
  watch?: WatchArg;
  createFileBeforeRun?: boolean;
  createDirectoryBeforeRun?: boolean;
};
export default class Task {
  target: string;
  targetOriginal: string;
  stat: Stats | null;
  run: (any) => any;
  watch: string[];
  createFileBeforeRun: boolean;
  createDirectoryBeforeRun: boolean;
  constructor(params: TaskParams) {
    let {
      target,
      run,
      watch = [],
      createFileBeforeRun = false,
      createDirectoryBeforeRun = false,
    } = params;
    watch = Array.isArray(watch) ? watch : [watch];

    this.targetOriginal = target;
    this.target = target;
    this.stat = null;
    this.run = run;
    this.watch = watch;
    this.createFileBeforeRun = createFileBeforeRun;
    this.createDirectoryBeforeRun = createDirectoryBeforeRun;
  }
  absPath(basePath: string) {
    return join(basePath, this.target);
  }
  async updateBasePath(newBasePath: string) {
    this.target = this.absPath(newBasePath);
    this.stat = await getStat(this.target);
  }
  runTask(): Execution {
    if (!existsSync(dirname(this.target))) {
      mkdirSync(dirname(this.target), { recursive: true });
    }
    return this.run(this.target);
  }
}
