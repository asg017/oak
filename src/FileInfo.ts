import { Stats } from "fs";

export default class FileInfo {
  path: string;
  stat: Stats | null;
  recipe: (any) => any;
  constructor(path: string, stat: Stats | null, recipe: (any) => any) {
    this.path = path;
    this.stat = stat;
    this.recipe = recipe;
  }
  async runRecipe() {
    await this.recipe(this.path);
  }
}
