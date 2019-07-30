import * as fs from "fs";
import { createLogger } from "./logging";
import { OakType } from "./types";

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

type OakfileConfigureType = {
  path: string;
  cleanRecipe: boolean;
  type?: "JSON" | "observable";
};

type ObservableCellId = {
  type: 'Identifier' | 'ViewExpression';
  start: number;
  end: number;
  name?: string;
  id?: ObservableCellId;
}

type ObservableCellBody = {

}
type ObservableCell = {
  type: string;
  id?: ObservableCellId;
  async: boolean;
  generator: boolean;
  start: number;
  end: number;
  body?: ObservableCellBody;
};

type ObservableProgram = {
  type: 'Program';
  start: number;
  end: number; 
  cells: ObservableCell[];
}
import {parseModule} from '@observablehq/parser';

const loadOakfileObservable = (path:string):Promise<OakType> {
  return new Promise((resolve, reject)=>{
    fs.readFile(path, 'utf8', (err:any, contents:string)=>{
      if(err) reject(err);
      const program:ObservableCell[] = parseModule(contents);
      
    })
  })
}
const loadOakfileJson = (config: OakfileConfigureType): Promise<OakType> => {
  const { path, cleanRecipe } = config;
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
export const loadOakfile = (
  config?: OakfileConfigureType
): Promise<OakType> => {
  const { path = "Oakfile", cleanRecipe = true, type = "JSON" } = config || {};
  switch (type) {
    case "JSON":
      return loadOakfileJson({ path, cleanRecipe });
    case 'observable':
      return loadOakfileObservable(path);
  }
};

export const getStat = (filename: string): Promise<fs.Stats> =>
  new Promise(function(res, rej) {
    fs.stat(filename, (err: any, stat: any) => {
      if (err) rej(err);
      res(stat);
    });
  });
