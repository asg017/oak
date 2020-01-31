import { Stats, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { getStat } from "./utils";

export default class PulseTask {
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
    this.target = join("oak_data", path);
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
    if (!existsSync(dirname(this.target))) {
      mkdirSync(dirname(this.target), { recursive: true });
    }
    return await this.run(this.target);
  }
}
