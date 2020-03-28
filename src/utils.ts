import { readFile, readdirSync, readFileSync, stat, Stats } from "fs-extra";
import { parseModule } from "@observablehq/parser";
import chalk from "chalk";
import { dirname, join } from "path";
import { merge } from "d3-array";
import hasha from "hasha";
import { LibraryKeys } from "./Library";

export const formatPath = (s: string) => chalk.black.bgWhiteBright.bold(s);
export const formatCellName = (s: string) => chalk.black.bgCyanBright.bold(s);

type DirStat = {
  dirStat: Stats;
  mtimeRecursive: number;
};

export type CellSignature = {
  cellHash: string;
  cellRefs: string[];
  ancestorHash: string;
};
export function parsedCellHashMap(
  parseResults: ParseOakfileResults
): Map<string, CellSignature> {
  const initMap: Map<
    string,
    { cellHash: string; cellRefs: string[] }
  > = new Map();
  const map: Map<string, CellSignature> = new Map();
  const cellsWithNames = parseResults.module.cells.filter(
    cell => cell?.id?.name
  );
  for (let cell of cellsWithNames) {
    const cellName = cell.id.name;
    const cellRefs = cell.references
      .map(ref => ref.name)
      .filter(ref => !LibraryKeys.has(ref));
    const cellContents = cell.input.substring(cell.start, cell.end);
    const hashContents = `${cellContents}`;
    const cellHash = hashString(hashContents);
    initMap.set(cellName, { cellHash, cellRefs });
  }
  for (let [cellName, { cellHash, cellRefs }] of initMap) {
    const refHashes = cellRefs
      .map(ref => initMap.get(ref))
      .filter(ref => ref)
      .map(ref => ref.cellHash);
    const ancestorHash = hashString(`${cellHash}${refHashes.join("")}`);
    map.set(cellName, { cellHash, cellRefs, ancestorHash });
  }
  return map;
}

export async function getDirectoryStat(
  directoryPath: string,
  directoryStat: Stats
): Promise<Stats> {
  // TODO: this should instead walk the directory. It should
  // go into any subdirectories and also include their mtimes
  // and their sizes. Right now, any subdirectory is ignored.
  const filesInDirectory = readdirSync(directoryPath);
  const fileStats: Stats[] = [];
  await Promise.all(
    filesInDirectory.map(filename => {
      const path = join(directoryPath, filename);
      return new Promise((resolve, reject) => {
        stat(path, (err: any, stat: Stats) => {
          if (err) {
            // reject even if a "file not found" error is thrown
            // since that shouldnt happen here bc were getting these
            // files from readdirSync right before
            reject(err);
          }
          fileStats.push(stat);
          resolve(stat);
        });
      });
    })
  );

  // assume the max mtime is the directory itself.
  // then, see if any of its file is newer.
  let maxMTime = directoryStat.mtime.getTime();
  let totalSize = 0;
  for (let currStat of fileStats) {
    totalSize += currStat.size;
    if (currStat.mtime.getTime() > maxMTime)
      maxMTime = currStat.mtime.getTime();
  }

  return Object.assign(directoryStat, {
    mtime: new Date(maxMTime),
    size: totalSize,
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
      if (stat.isDirectory()) {
        return getDirectoryStat(filename, stat).then(stat => res(stat));
      }
      res(stat);
    });
  });

export type OakCell = {
  start: number;
  end: number;
  input: string;
  references: {
    type: string;
    start: number;
    end: number;
    name: string;
  }[];
  id?: {
    type: string;
    name?: string;
    // used only for viewof and mutable i believe
    id?: {
      type: string;
      start: number;
      end: number;
      name: string;
    };
  };
  body: {
    type: string;
    start: number;
    end: number;
    specifiers?: any[]; // import only
    source?: {
      // import only
      type: string;
      start: number;
      end: number;
      value: string;
      raw: string;
    };
  };
  async: boolean;
  generator: boolean;
};
export type ParseOakfileResults = {
  module: {
    cells: OakCell[];
  };
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

export const hashFile = (filePath: string): string => {
  return hasha([readFileSync(filePath, "utf8")], { algorithm: "sha1" });
};

export const hashString = (s: string): string => {
  return hasha([s], { algorithm: "sha1" });
};

export function bytesToSize(bytes) {
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 B";
  var i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i == 0) return bytes + " " + sizes[i];
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
}

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
