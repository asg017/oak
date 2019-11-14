// Modified https://github.com/asg017/unofficial-observablehq-compiler/blob/master/src/compiler.js

import { parseOakfile, getBaseFileHashes } from "./utils";
import { dirname, join, resolve } from "path";
import { formatCellName } from "./utils";
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

type InjectingSource = {
  sourcePath: string;
  cells: string[];
};
/*
Given the parsed result of an Oakfile, create an define function 
with the results.

oakfilePath: Path to the Oakfile for the define function
oakfileModule: The parsed results of the Oakfile.
source: The source string of the original Oakfile. 
baseModuleDir: The path to the directory that oakfilePath is inside.
decorate: Whether to decorate the cell definitions wtih the default decorator.
injectingSource?: If this oakDefine is being injected from somewhere, then 
this is the path to the Oakfile that's doing the original injecting.
*/
export const oakDefine = async (
  oakfilePath: string,
  oakfileModule: any,
  source: string,
  baseModuleDir: string,
  decorator: Decorator,
  injectingSource?: InjectingSource
): Promise<DefineFunctionType> => {
  const depMap: Map<string, (runtime: any, observer: any) => void> = new Map();

  const importCells = oakfileModule.cells.filter(
    cell => cell.body.type === "ImportDeclaration"
  );

  await Promise.all(
    importCells.map(async cell => {
      const path = join(baseModuleDir, cell.body.source.value);
      const localSpecifiers = cell.body.specifiers.map(
        specifier => specifier.local.name
      );
      const is: InjectingSource | null =
        cell.body.injections !== undefined
          ? {
              sourcePath:
                (injectingSource && injectingSource.sourcePath) || oakfilePath,
              cells: localSpecifiers,
            }
          : null;
      const fromModule = await oakDefineFile(path, is, decorator);
      depMap.set([path, ...localSpecifiers].join(","), fromModule);
    })
  );
  let hash: (cellNames: string[]) => string | null;
  if (injectingSource) {
    hash = getBaseFileHashes(injectingSource.sourcePath, oakfilePath);
    const oakDir = join(baseModuleDir, ".oak", hash(injectingSource.cells));
    if (!existsSync(oakDir)) {
      mkdirSync(oakDir, { recursive: true });
    }
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
      const localSpecifiers = cell.body.specifiers.map(
        specifier => specifier.local.name
      );
      const other = runtime.module(
        depMap.get([path, ...localSpecifiers].join(","))
      );

      if (injections.length > 0) {
        const child = other.derive(injections, main);
        specifiers.map(specifier => {
          main.import(specifier.name, specifier.alias, child);
        });
      } else {
        specifiers.map(specifier => {
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

      main
        .variable(observer(cellName))
        .define(
          cellName,
          cellReferences,
          decorator
            ? decorator(
                cellFunction,
                injectingSource
                  ? join(baseModuleDir, ".oak", hash(injectingSource.cells))
                  : baseModuleDir
              )
            : cellFunction
        );
    });
    return main;
  };
};

type Decorator = (
  cellFunction: (...any) => any,
  baseModuleDir: string
) => (...any) => any;
/*

Given a Oakfile path, get the define function for that module. 
The define function can be used in the Observable runtime.
path: Path to the Oakfile
injectingSource?: If this Oakfile is being imported and the module
has an injection, this is the path to the file that is doing the injecting.
decorate: Whether to decorate the cell definintion with the 
default deorator. 
*/
export const oakDefineFile = async (
  path: string,
  injectingSource?: InjectingSource,
  decorator?: Decorator
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
    decorator,
    injectingSource
  );
};
