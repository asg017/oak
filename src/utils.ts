import * as fs from "fs";
import { createLogger } from "./logging";

type OakfileConfigureType = {
  path: string,
  cleanRecipe: boolean
};

const oakLogger = createLogger({ label: "Oak" });

const loadOakfile = (config?: OakfileConfigureType) => {
  const { path = "Oakfile", cleanRecipe = true } = config || {};
  return new Promise( (res, rej) => {
    fs.readFile(path, "utf8", (err: any, contents : string) => {
      if (err) rej(err);
      let oak;
      try {
        oak = JSON.parse(contents);
      } catch (err) {
        console.error(err);
        rej(err);
        return;
      }
      if (cleanRecipe) {
        for (let key in oak.variables) {
          let { recipe } = oak.variables[key];
          for (let key2 in oak.variables) {
            recipe = recipe.replace(
              `\${${key2}}`,
              oak.variables[key2].filename
            );
          }
          oak.variables[key].recipe = recipe;
        }
      }
      res(oak);
    });
  });
};

const getStat = filename =>
  new Promise(function(res, rej) {
    fs.stat(filename, (err:any, stat:any) => {
      if (err) rej(err);
      res(stat);
    });
  });


module.exports = {
  getStat,
  oakLogger,
  loadOakfile
}
