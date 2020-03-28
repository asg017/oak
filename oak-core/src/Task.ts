import { Stats, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { getStat } from "./utils";
import { Execution } from "./Execution";

export default class Task {
  target: string;
  stat: Stats | null;
  run: (any) => any;
  watch: string[];
  constructor(
    path: string,
    stat: Stats | null,
    run: (any) => Execution,
    watch: string[]
  ) {
    this.target = path;
    this.stat = stat;
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