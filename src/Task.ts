import { Stats } from "fs";
import { join } from "path";
import { getStat } from "./utils";

export default class Task {
  target: string;
  stat: Stats | null;
  run: (any) => any;
  watch: string[];
  constructor(
    path: string,
    stat: Stats | null,
    run: (any) => any,
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
  async runTask() {
    return await this.run(this.target);
  }
}
