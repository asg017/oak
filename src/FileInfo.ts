import { Stats } from "fs";
import { join } from "path";
import { getStat } from "./utils";

export default class FileInfo {
  path: string;
  stat: Stats | null;
  run: (any) => any;
  watch: string[];
  constructor(
    path: string,
    stat: Stats | null,
    run: (any) => any,
    watch: string[]
  ) {
    this.path = path;
    this.stat = stat;
    this.run = run;
    this.watch = watch;
  }
  absPath(basePath: string) {
    return join(basePath, this.path);
  }
  async updateBasePath(newBasePath: string) {
    this.path = this.absPath(newBasePath);
    this.stat = await getStat(this.path);
  }
  async runRecipe() {
    await this.run(this.path);
  }
}
