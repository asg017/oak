import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { Execution } from "./Execution";
import { Scheduler } from "./Library/Scheduler";

type WatchArg = string | string[];

type TaskParams = {
  target: string;
  run: (any) => any;
  watch?: WatchArg;
  schedule?: Scheduler;
  createFileBeforeRun?: boolean;
  createDirectoryBeforeRun?: boolean;
  freshIgnoreTarget?: boolean;
};
export default class Task {
  target: string;
  targetOriginal: string;
  run: (any) => any;
  watch: string[];
  createFileBeforeRun: boolean;
  createDirectoryBeforeRun: boolean;
  schedule: Scheduler;
  dependencySchedule: Scheduler;
  baseTargetDir: string;
  freshIgnoreTarget: boolean;

  constructor(params: TaskParams) {
    let {
      target,
      run,
      watch = [],
      schedule = null,
      createFileBeforeRun = false,
      createDirectoryBeforeRun = false,
      freshIgnoreTarget = false,
    } = params;
    watch = Array.isArray(watch) ? watch : [watch];

    this.targetOriginal = target;
    this.target = target;
    this.run = run;
    this.watch = watch;
    this.createFileBeforeRun = createFileBeforeRun;
    this.createDirectoryBeforeRun = createDirectoryBeforeRun;
    this.freshIgnoreTarget = freshIgnoreTarget;
    this.schedule = schedule;
    this.dependencySchedule = schedule;
  }
  async updateBasePath(newBasePath: string) {
    this.baseTargetDir = newBasePath;
    if (this.targetOriginal)
      this.target = join(this.baseTargetDir, this.targetOriginal);
  }
  runTask(): Execution {
    if (this.target && !existsSync(dirname(this.target))) {
      mkdirSync(dirname(this.target), { recursive: true });
    }
    return this.run(this.target);
  }
}
