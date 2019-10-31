import { readFile, readFileSync, stat, Stats } from "fs";
import { parseModule } from "@observablehq/parser";
import chalk from "chalk";
import { dirname, join } from "path";
import { merge } from "d3-array";
import * as hasha from "hasha";

export const formatPath = (s: string) => chalk.black.bgWhiteBright.bold(s);
export const formatCellName = (s: string) => chalk.black.bgCyanBright.bold(s);

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
``;

export type ParseOakfileResults = {
  module: any;
  contents: string;
};

export function parseOakfile(path: string): Promise<ParseOakfileResults> {
  return new Promise((resolve, reject) => {
    readFile(path, "utf8", (err: any, contents: string) => {
      if (err) reject(err);
      try {
        const oakModule = parseModule(contents);
        resolve({ module: oakModule, contents: contents });
      } catch (err) {
        reject(err);
      }
    });
  });
}

export const parseModules = async (
  filename: string,
  parsedOakfileSet?: Set<string>
): Promise<any[]> => {
  if (!parsedOakfileSet) {
    parsedOakfileSet = new Set([]);
  }
  if (parsedOakfileSet.has(filename)) {
    throw Error(
      `Circular imports. repeated Oakfile: "${filename}". Visited: ${Array.from(
        parsedOakfileSet
      )
        .map(f => `"${f}"`)
        .join(",")}`
    );
  }
  parsedOakfileSet.add(filename);

  const oakfile = await parseOakfile(filename);
  const dir = dirname(filename);
  const importCells = oakfile.module.cells.filter(
    cell => cell.body.type === "ImportDeclaration"
  );
  const importedModules = await Promise.all(
    importCells.map(importCell => {
      const path = join(dir, importCell.body.source.value);
      return parseModules(path, parsedOakfileSet);
    })
  );
  return [oakfile.module, ...merge(importedModules)];
};

export const getBaseFileHashes = (
  injectingSourcePath: string,
  oakfilePath: string
): ((cellNames: string[]) => string) => {
  const contents = [
    readFileSync(injectingSourcePath, "utf8"),
    readFileSync(oakfilePath, "utf8"),
  ];
  return (cellNames: string[]) => {
    return hasha([...contents, ...cellNames], { algorithm: "sha1" });
  };
};
