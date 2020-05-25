import { join } from "path";
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
  ensureEmptyFile?: boolean;
  ensureEmptyDirectory?: boolean;
  persistTarget?: boolean;
};
export default class Task {
  target: string;
  targetOriginal: string;
  run: (any) => any;
  watch: string[];
  schedule: Scheduler;
  dependencySchedule: Scheduler;
  baseTargetDir: string;
  freshIgnoreTarget: boolean;
  stdin: boolean;
  upstreamStdin: boolean;
  upstreamStdinId: string;
  upstreamOverridden: boolean;
  upstreamOverriddenId: string;
  ensureEmptyFile: boolean;
  ensureEmptyDirectory: boolean;
  persistTarget: boolean;

  constructor(params: TaskParams) {
    let {
      target,
      run,
      watch = [],
      schedule = null,
      freshIgnoreTarget = false,
      ensureEmptyFile = false,
      ensureEmptyDirectory = false,
      persistTarget = false,
    } = params;
    if (ensureEmptyFile && ensureEmptyDirectory)
      throw Error(
        "Task param Error: Only 'ensureEmptyFile' or 'ensureEmptyDirectory' can be true, not both."
      );
    watch = Array.isArray(watch) ? watch : [watch];

    this.targetOriginal = target;
    this.target = target;
    this.run = run;
    this.watch = watch;
    this.freshIgnoreTarget = freshIgnoreTarget;
    this.ensureEmptyFile = ensureEmptyFile;
    this.ensureEmptyDirectory = ensureEmptyDirectory;
    this.persistTarget = persistTarget;
    this.schedule = schedule;
    this.dependencySchedule = schedule;
    this.stdin = false;
    this.upstreamStdin = false;
    this.upstreamStdinId = null;
    this.upstreamOverridden = false;
    this.upstreamOverridden = null;
  }
  async updateBasePath(newBasePath: string) {
    this.baseTargetDir = newBasePath;
    if (this.targetOriginal)
      this.target = join(this.baseTargetDir, this.targetOriginal);
  }
  runTask(): Execution {
    return this.run(this.target);
  }
}
