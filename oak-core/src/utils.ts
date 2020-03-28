import { readFile, readdirSync, readFileSync, stat, Stats } from "fs-extra";
import { parseModule } from "@observablehq/parser";
import chalk from "chalk";
import { dirname, isAbsolute, join } from "path";
import { merge } from "d3-array";
import hasha from "hasha";
import { LibraryKeys } from "./Library";
import untildify from "untildify";

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

type Node = {
  type: "normal" | "import";
  otherOakfile?: string;
  cellName: string;
  cellRefs: string[];
  cellContents: string;
};

export function fileArgument(inputPath: string): string {
  const expand = untildify(inputPath);
  return isAbsolute(expand) ? expand : join(process.cwd(), expand);
}

function topoSort(parseResults: ParseOakfileResults): Node[] {
  const seen = new Set();
  const tmp = new Set();
  const nodes: Map<string, Node> = new Map();

  const sortedList: Node[] = [];

  function visit(node: Node) {
    if (seen.has(node.cellName)) return;
    if (tmp.has(node.cellName))
      throw Error(
        `There is a cycle in the Oakfile defintion. Found with ${node.cellName}, ${node.cellContents}`
      );
    tmp.add(node.cellName);
    for (let refNodeName of node.cellRefs) {
      if (!nodes.has(refNodeName))
        throw Error(`${refNodeName} not defined yet for ${node.cellName}`);
      visit(nodes.get(refNodeName));
    }
    tmp.delete(node.cellName);
    seen.add(node.cellName);
    sortedList.push(node);
  }

  for (let cell of parseResults.module.cells) {
    if (!cell?.id?.name && !cell.body.specifiers?.length) continue;
    if (cell.body.type === "ImportDeclaration") {
      // oh boy
      const injections = (cell.body?.injections || []).map(
        n => n.imported.name
      );
      const otherOakfile = cell.body.source.value;
      const cellContents = cell.input.substring(cell.start, cell.end);
      for (let specifier of cell.body.specifiers) {
        const cellName = specifier.local.name;
        nodes.set(cellName, {
          type: "import",
          cellName,
          cellRefs: injections,
          cellContents,
          otherOakfile,
        });
      }
    } else {
      const cellName = cell.id.name;
      const cellRefs = cell.references
        .map(ref => ref.name)
        .filter(ref => !LibraryKeys.has(ref));
      const cellContents = cell.input.substring(cell.start, cell.end);
      nodes.set(cellName, { type: "normal", cellName, cellRefs, cellContents });
    }
  }

  for (let [cellName, node] of nodes) {
    visit(node);
  }
  return sortedList;
}

export function parsedCellHashMap(
  oakfilePath: string,
  parseResults: ParseOakfileResults
): Map<string, CellSignature> {
  const initMap: Map<
    string,
    { cellHash: string; cellRefs: string[] }
  > = new Map();

  const map: Map<string, CellSignature> = new Map();
  const topoCellNames: Node[] = topoSort(parseResults);
  for (let {
    cellName,
    cellRefs,
    cellContents,
    type,
    otherOakfile,
  } of topoCellNames) {
    if (type === "normal") {
      const cellHash = hashString(cellContents);
      const ancestorHash = hashString(
        `${cellHash}${cellRefs.map(ref => {
          if (!map.has(ref))
            throw Error(`Some problem with topo sort, pls add more `);
          return map.get(ref).ancestorHash;
        })}`
      );
      map.set(cellName, { cellHash, cellRefs, ancestorHash });
    }
    if (type === "import") {
      const cellHash = hashString(cellContents);
      const otherOakfileHash = hashFile(
        join(dirname(oakfilePath), otherOakfile)
      );
      const ancestorHash = hashString(
        `${cellHash}${cellRefs.map(ref => {
          if (!map.has(ref))
            throw Error(`Some problem with topo sort, pls add more `);
          return map.get(ref).ancestorHash;
        })}${otherOakfileHash}`
      );
      map.set(cellName, { cellHash, cellRefs, ancestorHash });
    }
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
    // import only
    specifiers?: {
      type: string;
      start: number;
      end: number;
      view: boolean;
      mutable: boolean;
      imported: {
        type: string;
        start: number;
        end: number;
        name: string;
      };
      local: {
        type: string;
        start: number;
        end: number;
        name: string;
      };
    }[];
    // import only
    injections?: {
      type: string;
      start: number;
      end: number;
      view: boolean;
      mutable: boolean;
      imported: {
        type: string;
        start: number;
        end: number;
        name: string;
      };
      local: {
        type: string;
        start: number;
        end: number;
        name: string;
      };
    }[];
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