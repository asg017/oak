import { readFile, readFileSync, stat, Stats } from "fs";
import { parseModule } from "@observablehq/parser";
import chalk from "chalk";
import { dirname, join } from "path";
import { merge } from "d3-array";
import hasha from "hasha";

export const formatPath = (s: string) => chalk.black.bgWhiteBright.bold(s);
export const formatCellName = (s: string) => chalk.black.bgCyanBright.bold(s);

type DirStat = {
  dirStat: Stats;
  mtimeRecursive: number;
};
export async function getDirectoryStat(
  directoryPath: string
): Promise<DirStat> {
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
}
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

export function duration(referenceDate: Date, fromDate?: Date): string {
  if (!fromDate) fromDate = new Date();
  const ms = fromDate.getTime() - referenceDate.getTime();
  if (ms < 1000) return `just now`;
  const numSeconds = Math.floor(ms / 1000);
  if (numSeconds < 60) {
    return `${numSeconds} second${numSeconds <= 1 ? "" : "s"} ago`;
  }
  const numMinutes = Math.floor(numSeconds / 60);
  if (numMinutes < 60) {
    return `${numMinutes} minute${numMinutes <= 1 ? "" : "s"} ago`;
  }
  const numHours = Math.floor(numMinutes / 60);
  if (numHours < 24) {
    return `${numHours} hour${numHours <= 1 ? "" : "s"} ago`;
  }
  const numDays = Math.floor(numHours / 24);
  return `${numDays} day${numDays <= 1 ? "" : "s"} ago`;
}
