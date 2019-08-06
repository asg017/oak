import { Stats } from "fs";
import { join } from "path";

export default class FileInfo {
  path: string;
  stat: Stats | null;
  recipe: (any) => any;
  constructor(path: string, stat: Stats | null, recipe: (any) => any) {
    this.path = path;
    this.stat = stat;
    this.recipe = recipe;
  }
  absPath(basePath: string) {
    return join(basePath, this.path);
  }
  async runRecipe(basePath: string) {
    await this.recipe(this.path);
  }
}
