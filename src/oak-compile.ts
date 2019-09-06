import { getStat, parseOakfile } from "./utils";
import FileInfo from "./FileInfo";
import { dirname, join } from "path";
import { formatCellName, formatPath } from "./utils";
import { brotliDecompressSync } from "zlib";

const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
const GeneratorFunction = Object.getPrototypeOf(function* () { }).constructor;
const AsyncGeneratorFunction = Object.getPrototypeOf(async function* () { })
  .constructor;

type Inspector = {
  pending: () => void;
  fulfilled: (value: any) => void;
  rejected: (error: any) => void;
};
type DefineFunctionType = (
  runtime: any,
  observer: (name: string) => Inspector | null
) => any;

type ObservableImportDeclaration = {
  type: "ImportDeclaration";
  specifiers: {
    type: "ImportSpecifier";
    view: boolean;
    imported: { type: "Identifier"; name: string };
    local: { type: "Identifier"; name: string };
  }[];
  source: { type: "Literal"; value: string; raw: string };
  start: number;
  end: number;
};
type ObservableLiteral = {
  type: "Literal";
  value: any;
  raw: string;
  start: number;
  end: number;
};
type ObservableBlockStatement = {
  type: "BlockStatement";
  body: any[];
  start: number;
  end: number;
};
type ObservableCell = {
  type: "Cell";
  id: {
    type: "Identifier";
    name: string;
  } | null;
  async: boolean;
  generator: boolean;
  references: { type: string; name: string }[];
  body: ObservableLiteral &
  ObservableImportDeclaration &
  ObservableBlockStatement;
};
export const defineCellImport = async (
  cell: ObservableCell,
  baseModuleDir: string
): Promise<{
  names: string[];
  aliases: string[];
  from: () => void;
}> => {
  const path = join(baseModuleDir, cell.body.source.value);
  const fromModule = await oakDefineFile(path);
  const names = cell.body.specifiers.map(specifier => specifier.imported.name);
  const aliases = cell.body.specifiers.map(specifier => specifier.local.name);

  return { names, aliases, from: fromModule };
};

export const defineCell = (
  cell: ObservableCell,
  source: string
): { cellFunction: any; cellName: string; cellReferences: string[] } => {
  let name = null;
  if (cell.id && cell.id.name) name = cell.id.name;
  const bodyText = source.substring(cell.body.start, cell.body.end);
  let code;
  if (cell.body.type !== "BlockStatement") {
    if (cell.async)
      code = `return (async function(){ return (${bodyText});})()`;
    else code = `return (function(){ return (${bodyText});})()`;
  } else code = bodyText;
  const references = (cell.references || []).map(ref => {
    if (ref.type === "ViewExpression") throw Error("ViewExpression wat");
    return ref.name;
  });

  let f;

  if (cell.generator && cell.async)
    f = new AsyncGeneratorFunction(...references, code);
  else if (cell.async) f = new AsyncFunction(...references, code);
  else if (cell.generator) f = new GeneratorFunction(...references, code);
  else f = new Function(...references, code);
  return {
    cellName: name,
    cellFunction: f,
    cellReferences: references
  };
};

// acts as a man-in-the-middle compiler/runtime decorator thingy
export const defineCellDefinition = (
  cellFunction: (...any) => any,
  baseModuleDir: string
): ((...any) => any) => {
  return async function (...dependencies) {
    // dont try and get fileinfo for cell depends like `cell` or `shell`
    let cellDependents = [];
    dependencies.map(dependency => {
      if (dependency instanceof FileInfo) {
        cellDependents.push(dependency);
      }
    });
    let currCell = await cellFunction(...dependencies);

    if (currCell instanceof FileInfo) {
      await currCell.updateBasePath(baseModuleDir);
      // run recipe if no file or if it's out of date
      if (currCell.stat === null) {
        console.log(
          `${formatPath(currCell.path)} - Doesn't exist - running recipe...`
        );
        await currCell.runRecipe();
        currCell.stat = await getStat(currCell.path);
        return currCell;
      }
      const deps = cellDependents.filter(
        c => currCell.stat.mtime <= c.stat.mtime
      );
      if (deps.length > 0) {
        console.log(`${formatPath(currCell.path)} - out of date:`);
        console.log(deps.map(d => `\t${formatPath(d.path)}`).join(","));
        await currCell.runRecipe();
        currCell.stat = await getStat(currCell.path);
        return currCell;
      } else {
        console.log(`${formatPath(currCell.path)} - not out of date `);
        return currCell;
      }
    }
    return currCell;
  };
};

export const oakDefine = (
  oakfileModule: any,
  source: string,
  baseModuleDir: string
): DefineFunctionType => {
  return async function define(runtime, observer) {
    const main = runtime.module();
    const importCells = oakfileModule.cells.filter(
      cell => cell.body.type === "ImportDeclaration"
    );
    const regularCells = oakfileModule.cells.filter(
      cell => cell.body.type !== "ImportDeclaration"
    );
    // import all needed cells first.
    await Promise.all(
      importCells.map(async cell => {
        const { names, aliases, from } = await defineCellImport(
          cell,
          baseModuleDir
        ).catch(err => {
          throw Error("Error defining import cell");
        });
        const childNames = [];
        const child = runtime.module(from, name => {
          childNames.push(name);
          return true;
        });
        await Promise.all(childNames.map(n => child.value(n)));
        console.log(childNames);
        for (let i = 0; i < names.length; i++) {
          console.log(
            `oakDefine import name=${names[i]} aliases=${aliases[i]}`
          );

          main.import(names[i], aliases[i], child);
        }
        return;
      })
    );
    regularCells.map(async cell => {
      const { cellName, cellFunction, cellReferences } = defineCell(
        cell,
        source
      );
      console.log(
        `oakDefine cell=${formatCellName(cellName)} refs=${cellReferences.join(
          ","
        )}`
      );
      main
        .variable(observer(cellName))
        .define(
          cellName,
          cellReferences,
          defineCellDefinition(cellFunction, baseModuleDir)
        );
    });
    return main;
  };
};

export const oakDefineFile = async (path: string): Promise<any> => {
  const parseResults = await parseOakfile(path).catch(err => {
    throw Error(`Error parsing Oakfile at ${path} ${err}`);
  });
  const oakfileModule = parseResults.module;
  const oakfileContents = parseResults.contents;
  const baseModuleDir = dirname(path);
  return oakDefine(oakfileModule, oakfileContents, baseModuleDir);
};