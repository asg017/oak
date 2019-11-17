// Modified https://github.com/asg017/unofficial-observablehq-compiler/blob/master/src/compiler.js

import { parseOakfile, getBaseFileHashes } from "./utils";
import { dirname, join, resolve } from "path";
import { existsSync, mkdirSync } from "fs";
import {
  InjectingSource,
  ObservableCell,
  DefineFunctionType,
  Decorator,
} from "./oak-compile-types";
import * as log from "npmlog";

const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const GeneratorFunction = Object.getPrototypeOf(function*() {}).constructor;
const AsyncGeneratorFunction = Object.getPrototypeOf(async function*() {})
  .constructor;

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

async function createOakDefinition(
  path: string, // absolote path to the oakfile
  source: string,
  module: any,
  decorator: Decorator,
  injectingSource?: InjectingSource
) {
  const depMap: Map<string, (runtime: any, observer: any) => void> = new Map();

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
    const fromModule = await c.file(
      outsideModulePath,
      decorator,
      localInjectingSource
    );
    depMap.set([outsideModulePath, ...localSpecifiers].join(","), fromModule);
  });

  await Promise.all(importCellsPromises);

  let hash: (cellNames: string[]) => string | null;
  if (injectingSource) {
    hash = getBaseFileHashes(injectingSource.sourcePath, path);
    const oakDir = join(dirname(path), ".oak", hash(injectingSource.cells));
    if (!existsSync(oakDir)) {
      mkdirSync(oakDir, { recursive: true });
    }
  }

  return async function define(runtime, observer) {
    const main = runtime.module();
    const importCells = module.cells.filter(
      cell => cell.body.type === "ImportDeclaration"
    );
    const regularCells = module.cells.filter(
      cell => cell.body.type !== "ImportDeclaration"
    );
    importCells.map(cell => {
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
          main.import(specifier.name, specifier.alias, child);
        });
      } else {
        specifiers.map(specifier => {
          main.import(specifier.name, specifier.alias, other);
        });
      }
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
                  ? join(dirname(path), ".oak", hash(injectingSource.cells))
                  : dirname(path)
              )
            : cellFunction
        );
    });
    return main;
  };
}

export class OakCompiler {
  constructor() {}
  async file(
    path: string,
    decorator?: Decorator,
    injectingSource?: InjectingSource
  ): Promise<(runtime: any, observer: any) => any> {
    log.info("file", path, injectingSource);
    const parseResults = await parseOakfile(path).catch(err => {
      throw Error(`Error parsing Oakfile at ${path} ${err}`);
    });

    return await createOakDefinition(
      path,
      parseResults.contents,
      parseResults.module,
      decorator,
      injectingSource
    );
  }
}
