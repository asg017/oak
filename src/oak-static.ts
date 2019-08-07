import { Runtime } from "@observablehq/runtime";
import { Library } from "./Library";
import { getStat, parseOakfile } from "./utils";
import FileInfo from "./FileInfo";
import { dirname, join } from "path";
import { EventEmitter } from "events";
import chalk from "chalk";

const formatPath = (s: string) => chalk.black.bgWhiteBright.bold(s);
const formatCellName = (s: string) => chalk.black.bgCyanBright.bold(s);

const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const GeneratorFunction = Object.getPrototypeOf(function*() {}).constructor;
const AsyncGeneratorFunction = Object.getPrototypeOf(async function*() {})
  .constructor;

const defineCellImport = async (
  cell: any,
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

const defineCell = (
  cell: any,
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
const defineCellDefinition = (
  cellFunction: (...any) => any,
  baseModuleDir: string
): ((...any) => any) => {
  return async function(...dependencies) {
    // dont try and get fileinfo for cell depends like `cell` or `bash`
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
          `Running recipe for ${formatPath(
            currCell.path
          )} because it doesnt exist`
        );
        await currCell.runRecipe();
        currCell.stat = await getStat(currCell.path);
        return currCell;
      }
      const deps = cellDependents.filter(
        c => currCell.stat.mtime < c.stat.mtime
      );
      if (deps.length > 0) {
        console.log(
          `Re-running recipe for ${formatPath(currCell.path)} because:`
        );
        deps.map(d => console.log(`\t${formatPath(d.path)}`));
        await currCell.runRecipe();
        currCell.stat = await getStat(currCell.path);
        return currCell;
      } else {
        console.log(
          `no need to re-run recipe for ${formatPath(currCell.path)}`
        );
        return currCell;
      }
    }
    return currCell;
  };
};

const oakDefine = (
  oakfileModule: any,
  source: string,
  baseModuleDir: string
): ((runtime: any, observer: any) => any) => {
  return function define(runtime, observer) {
    const main = runtime.module();

    oakfileModule.cells.map(async cell => {
      if (cell.body.type === "ImportDeclaration") {
        const { names, aliases, from } = await defineCellImport(
          cell,
          baseModuleDir
        );
        const child = runtime.module(from);
        for (let i = 0; i < names.length; i++) {
          console.log(
            `oakDefine import name=${names[i]} aliases=${aliases[i]}`
          );

          main.import(names[i], aliases[i], child);
        }
      } else {
        const { cellName, cellFunction, cellReferences } = defineCell(
          cell,
          source
        );
        console.log(
          `oakDefine cell=${formatCellName(
            cellName
          )} refs=${cellReferences.join(",")}`
        );
        console.log(cellReferences);
        main
          .variable(observer(cellName))
          .define(
            cellName,
            cellReferences,
            defineCellDefinition(cellFunction, baseModuleDir)
          );
      }
    });
    return main;
  };
};

const oakDefineFile = async (path: string): Promise<any> => {
  const parseResults = await parseOakfile(path);
  const oakfileModule = parseResults.module;
  const oakfileContents = parseResults.contents;
  const baseModuleDir = dirname(path);
  return oakDefine(oakfileModule, oakfileContents, baseModuleDir);
};

export async function oak_static(args: {
  filename: string;
  targets: readonly string[];
}) {
  const targetSet = new Set(args.targets);
  const oakfilePath = join(process.cwd(), args.filename);

  const runtime = new Runtime(new Library());
  const define = await oakDefineFile(oakfilePath);
  const ee = new EventEmitter();
  const taskDefs = [];

  console.log(
    `Oak: ${formatPath(oakfilePath)}${
      targetSet.size > 0
        ? ` - targets: ${Array.from(targetSet)
            .map(formatCellName)
            .join(",")}`
        : ""
    }`
  );
  runtime.module(define, (name: string) => {
    console.log(targetSet.size === 0 || targetSet.has(name));
    return targetSet.size === 0 || targetSet.has(name)
      ? {
          pending() {
            ee.emit(name, "pending");
          },
          fulfilled(value) {
            ee.emit(name, "fulfilled", value);
          },
          rejected(error) {
            ee.emit(name, "rejected", error);
          }
        }
      : null;
  });
}
