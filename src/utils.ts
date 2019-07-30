import * as fs from "fs";
import { createLogger } from "./logging";
import { OakfileConfigureType, OakType } from "./types";

/*
enum OakfileLoadTypeEnum {
  JSON = "JSON"
}

export class classOakfile {
  data: OakType;
  load(
    filename: string,
    type: OakfileLoadTypeEnum = OakfileLoadTypeEnum.JSON
  ): {};
}*/

export const oakLogger = createLogger({ label: "Oak" });

const convertMakefile = (oak: OakType): string => {
  return ``;
};

const readJson = (path: string): Promise<any> =>
  new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err: any, contents: string) => {
      if (err) reject(err);
      let object = null;
      try {
        object = JSON.parse(contents);
      } catch (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve(object);
    });
  });

export const loadOakfile = (
  config?: OakfileConfigureType
): Promise<OakType> => {
  const { path = "Oakfile", cleanRecipe = true } = config || {};
  return new Promise((res, rej) => {
    readJson(path)
      .then(oak => {
        // const replaceRecipeNames(rawRecipe:string, )
        let Oak: OakType = {
          variables: []
        };
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
        Object.keys(oak.variables).map(key => {
          const variable = oak.variables[key];
          Oak.variables.push({
            name: key,
            deps: variable.deps,
            recipe: variable.recipe,
            filename: variable.filename
          });
        });
        res(Oak);
      })
      .catch(err => {
        rej(err);
      });
  });
};

export const getStat = (filename: string): Promise<fs.Stats> =>
  new Promise(function(res, rej) {
    fs.stat(filename, (err: any, stat: any) => {
      if (err) rej(err);
      res(stat);
    });
  });
