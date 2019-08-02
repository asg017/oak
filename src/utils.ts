import { readFile, stat, Stats } from "fs";
import { parseModule } from "@observablehq/parser";
import { createLogger } from "./logging";
export const oakLogger = createLogger({ label: "Oak" });

export const getStat = (filename: string): Promise<Stats | null> =>
  new Promise(function(res, rej) {
    stat(filename, (err: any, stat: any) => {
      if (err) {
        if (err.code === "ENOENT") {
          res(null);
          return;
        }
        rej(err);
      }
      res(stat);
    });
  });

export function parseOakfile(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    readFile(path, "utf8", (err: any, contents: string) => {
      if (err) reject(err);
      try {
        const oakModule = parseModule(contents);
        resolve(oakModule);
      } catch (err) {
        reject(err);
      }
    });
  });
}
