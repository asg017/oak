import { Stats, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { getStat } from "./utils";
import { Execution } from "./Execution";

type WatchArg = string | string[];

export default class Task {
  target: string;
  targetOriginal: string;
  stat: Stats | null;
  run: (any) => any;
  watch: string[];
  constructor(params: { target: string; run: (any) => any; watch?: WatchArg }) {
    let { target, run, watch = [] } = params;
    watch = Array.isArray(watch) ? watch : [watch];

    this.targetOriginal = target;
    this.target = target;
    this.stat = null;
    this.run = run;
    this.watch = watch;
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
