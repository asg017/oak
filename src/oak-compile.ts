// Modified https://github.com/asg017/unofficial-observablehq-compiler/blob/master/src/compiler.js

import {
  parseOakfile,
  getBaseFileHashes,
  ParseOakfileResults,
  parsedCellHashMap,
  CellSignature,
} from "./utils";
import { parseCell } from "@observablehq/parser";
import { dirname, join } from "path";
import {
  InjectingSource,
  ObservableCell,
  Decorator,
} from "./oak-compile-types";

type DepMap = Map<string, (runtime: any, observer: any) => void>;

const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const GeneratorFunction = Object.getPrototypeOf(function*() {}).constructor;
const AsyncGeneratorFunction = Object.getPrototypeOf(async function*() {})
  .constructor;

export const createRegularCellDefinition = (
  main: any,
  observer: (name: string) => void,
  cell: ObservableCell,
  define: boolean,
  decorate?: (
    f: (...any) => any,
    cellName: string,
    references: string[]
  ) => (...any) => any
) => {
  let cellName = null;
  if (cell.id && cell.id.id && cell.id.id.name) cellName = cell.id.id.name;
  else if (cell.id && cell.id.name) cellName = cell.id.name;
  const bodyText = cell.input.substring(cell.body.start, cell.body.end);
  let code;
  if (cell.body.type !== "BlockStatement") {
    if (cell.generator && cell.async)
      code = `return (async function*(){ yield * await (${bodyText});})()`;
    else if (cell.generator) `return (function*(){ return (${bodyText});})()`;
    else if (cell.async)
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
  f = decorate ? decorate(f, cellName, references) : f;
  if (define) main.variable(observer(cellName)).define(cellName, references, f);
  else main.redefine(cellName, references, f);
};

/*
 * import {a as x, b as y} with {c as t, d as u} from "Asdf"
 *
 * a, b : cell.body.specifiers, spec => spec.imported.name
 * x, y : cell.body.specifiers, spec => spec.local.name
 *
 * c, d : cell.body.injections, inj => inj.imported.name
 * t, u : cell.body.injections, inj => inj.local.name
 * "Asdf" : cell.body.source.value
 */

function createImportCellDefinition(
  runtime: any,
  main: any,
  observer: (name: string) => void,
  path: string,
  depMap: DepMap,
  cell: ObservableCell
) {
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
  const importCellPath = join(dirname(path), cell.body.source.value);
  const localSpecifiers = cell.body.specifiers.map(
    specifier => specifier.local.name
  );
  const other = runtime.module(
    depMap.get([importCellPath, ...localSpecifiers].join(","))
  );
  if (injections.length > 0) {
    const child = other.derive(injections, main);
    specifiers.map(specifier => {
      main
        .variable(observer(specifier.alias))
        .import(specifier.name, specifier.alias, child);
    });
  } else {
    specifiers.map(specifier => {
      main
        .variable(observer(specifier.alias))
        .import(specifier.name, specifier.alias, other);
    });
  }
}
function createCellDefinition(
  path: string,
  cell: ObservableCell,
  oakfileContents: string,
  runtime: any,
  main: any,
  observer: (name: string) => void,
  depMap: any,
  define: boolean,
  decorator: Decorator,
  cellHashMap: Map<string, CellSignature>,
  baseModuleDir,
  importId: string
) {
  if (cell.body.type === "ImportDeclaration") {
    createImportCellDefinition(runtime, main, observer, path, depMap, cell);
  } else {
    const decorate = (f, cellName, references) => {
      return decorator(
        f,
        cellName,
        references,
        cellHashMap.get(cellName),
        baseModuleDir,
        path,
        importId
      );
    };
    createRegularCellDefinition(main, observer, cell, define, decorate);
  }
}
async function createOakDefinition(
  path: string, // absolute path to the oakfile
  parseResults: ParseOakfileResults,
  cellHashMap: Map<string, CellSignature>,
  decorator: Decorator,
  injectingSource?: InjectingSource
) {
  const { contents: oakfileContents, module } = parseResults;
  const depMap: DepMap = new Map();

  const importCells = module.cells.filter(
    cell => cell.body.type === "ImportDeclaration"
  );

  const importCellsPromises = importCells.map(async cell => {
    const outsideModulePath = join(dirname(path), cell.body.source.value);
    const localSpecifiers = cell.body.specifiers.map(
      specifier => specifier.local.name
    );

    // if we are injecting, then we need to compile downstream modules with that knowledge.
    // if we haven't been injecting yet, then we make our own (with "path"),
    // otherwise use the non-empty injectingSource
    let localInjectingSource: InjectingSource | null;
    if (cell.body.injections !== undefined)
      localInjectingSource = {
        sourcePath: (injectingSource && injectingSource.sourcePath) || path,
        cells: localSpecifiers,
      };
    const c = new OakCompiler();
    const { define: fromModule } = await c.file(
      outsideModulePath,
      decorator,
      localInjectingSource
    );
    depMap.set([outsideModulePath, ...localSpecifiers].join(","), fromModule);
  });

  await Promise.all(importCellsPromises);

  let baseModuleDir: string;
  let importId: string;

  if (injectingSource) {
    const hash = getBaseFileHashes(injectingSource.sourcePath, path);
    importId = hash(injectingSource.cells);
    baseModuleDir = join(dirname(path), "oak_data", ".oak-imports", importId);
  } else {
    baseModuleDir = join(dirname(path), "oak_data");
  }

  return async function define(runtime, observer) {
    const main = runtime.module();
    for (const cell of module.cells) {
      createCellDefinition(
        path,
        cell,
        oakfileContents,
        runtime,
        main,
        observer,
        depMap,
        true,
        decorator,
        cellHashMap,
        baseModuleDir,
        importId
      );
    }
    return main;
  };
}

type Define = (runtime: any, observer: any) => any;
type DefineCell = (module: any, observer: any) => any;
export class OakCompiler {
  constructor() {}
  cell(
    cellText: string
  ): { define: DefineCell; redefine: DefineCell; cell: ObservableCell } {
    const cell = parseCell(cellText);
    cell.input = cellText;
    if (cell.body.type === "ImportDeclaration") {
      throw Error("Cannot compile individual import cells.");
    }
    return {
      define(module, observer) {
        createRegularCellDefinition(module, observer, cell, true);
      },
      redefine(module, observer) {
        createRegularCellDefinition(module, observer, cell, false);
      },
      cell,
    };
  }
  async file(
    path: string,
    decorator?: Decorator,
    injectingSource?: InjectingSource
  ): Promise<{
    define: Define;
    cellHashMap: Map<string, CellSignature>;
    parseResults: ParseOakfileResults;
  }> {
    const parseResults = await parseOakfile(path).catch(err => {
      throw Error(`Error parsing Oakfile at ${path} ${err}`);
    });

    const cellHashMap = parsedCellHashMap(path, parseResults);

    const define = await createOakDefinition(
      path,
      parseResults,
      cellHashMap,
      decorator,
      injectingSource
    );
    return { define, cellHashMap, parseResults };
  }
}
