// Modified https://github.com/asg017/unofficial-observablehq-compiler/blob/master/src/compiler.js

import { getStat, parseOakfile, getInjectHash } from "./utils";
import FileInfo from "./FileInfo";
import { dirname, join, resolve } from "path";
import { formatCellName, formatPath } from "./utils";
import { existsSync, mkdirSync } from "fs";

const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const GeneratorFunction = Object.getPrototypeOf(function*() {}).constructor;
const AsyncGeneratorFunction = Object.getPrototypeOf(async function*() {})
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
    id: {
      name: string;
    };
  } | null;
  async: boolean;
  generator: boolean;
  references: { type: string; name: string }[];
  body: ObservableLiteral &
    ObservableImportDeclaration &
    ObservableBlockStatement;
};

export const createRegularCellDefintion = (
  cell: ObservableCell,
  source: string
): { cellFunction: any; cellName: string; cellReferences: string[] } => {
  let name = null;
  if (cell.id && cell.id.id && cell.id.id.name) name = cell.id.id.name;
  else if (cell.id && cell.id.name) name = cell.id.name;
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
    cellReferences: references,
  };
};

// acts as a man-in-the-middle compiler/runtime decorator thingy
export const decorateCellDefintion = (
  cellFunction: (...any) => any,
  baseModuleDir: string
): ((...any) => any) => {
  return async function(...dependencies) {
    // dont try and get fileinfo for cell depends like `cell` or `shell`
    let cellDependents = [];
    dependencies.map(dependency => {
      if (dependency instanceof FileInfo) {
        cellDependents.push(dependency);
      }
    });
    let currCell = await cellFunction(...dependencies);

    if (currCell instanceof FileInfo) {
      console.log("1", currCell.path);
      await currCell.updateBasePath(baseModuleDir);

      console.log("2", currCell.path);
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

export const oakDefine = async (
  oakfilePath: string,
  oakfileModule: any,
  source: string,
  baseModuleDir: string,
  decorate: boolean,
  injectingSource?: string
): Promise<DefineFunctionType> => {
  const depMap: Map<string, (runtime: any, observer: any) => void> = new Map();

  const importCells = oakfileModule.cells.filter(
    cell => cell.body.type === "ImportDeclaration"
  );

  await Promise.all(
    importCells.map(async cell => {
      const path = join(baseModuleDir, cell.body.source.value);
      const fromModule = await oakDefineFile(
        path,

        cell.body.injections !== undefined ? oakfilePath : null,
        decorate
      );
      depMap.set(path, fromModule);
    })
  );
  let hash;
  if (injectingSource) {
    hash = await getInjectHash(injectingSource, oakfilePath);
    const oakDir = join(baseModuleDir, ".oak", hash);
    if (!existsSync(oakDir)) {
      mkdirSync(oakDir, { recursive: true });
    }
    console.log(
      `injecting ${injectingSource} from ${oakfilePath} with hash=${hash}`
    );
  }
  return async function define(runtime, observer) {
    const main = runtime.module();
    const importCells = oakfileModule.cells.filter(
      cell => cell.body.type === "ImportDeclaration"
    );
    const regularCells = oakfileModule.cells.filter(
      cell => cell.body.type !== "ImportDeclaration"
    );
    importCells.map(async (cell, i) => {
      const specifiers: { name: string; alias: string }[] = [];
      if (cell.body.specifiers)
        for (const specifier of cell.body.specifiers) {
          specifiers.push({
            name: specifier.imported.name,
            alias: specifier.local.name,
          });
        }
      const injections: { name: string; alias: string }[] = [];
      if (cell.body.injections !== undefined)
        for (const injection of cell.body.injections) {
          injections.push({
            name: injection.imported.name,
            alias: injection.local.name,
          });
        }
      const path = join(baseModuleDir, cell.body.source.value);
      const other = runtime.module(depMap.get(path));

      if (injections.length > 0) {
        console.log(`injecting ${JSON.stringify(injections)}`);
        const child = other.derive(injections, main);
        specifiers.map(specifier => {
          console.log(
            `oakDefine import name=${specifier.name} alias=${specifier.alias}`
          );
          main.import(specifier.name, specifier.alias, child);
        });
      } else {
        specifiers.map(specifier => {
          console.log(
            `oakDefine import name=${specifier.name} alias=${specifier.alias}`
          );
          main.import(specifier.name, specifier.alias, other);
        });
      }
      return;
    });

    regularCells.map(cell => {
      const {
        cellName,
        cellFunction,
        cellReferences,
      } = createRegularCellDefintion(cell, source);
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
          decorate
            ? decorateCellDefintion(
                cellFunction,
                injectingSource
                  ? join(baseModuleDir, ".oak", hash)
                  : baseModuleDir
              )
            : cellFunction
        );
    });
    return main;
  };
};

export const oakDefineFile = async (
  path: string,
  injectingSource?: string,
  decorate: boolean = true
): Promise<any> => {
  const parseResults = await parseOakfile(path).catch(err => {
    throw Error(`Error parsing Oakfile at ${path} ${err}`);
  });
  const oakfileModule = parseResults.module;
  const oakfileContents = parseResults.contents;
  const baseModuleDir = dirname(path);
  return oakDefine(
    resolve(path),
    oakfileModule,
    oakfileContents,
    baseModuleDir,
    decorate,
    injectingSource
  );
};
