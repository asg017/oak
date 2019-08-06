import { Runtime } from "@observablehq/runtime";
import { Library } from "./Library";
import { getStat, parseOakfile } from "./utils";
import FileInfo from "./FileInfo";

const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const GeneratorFunction = Object.getPrototypeOf(function*() {}).constructor;
const AsyncGeneratorFunction = Object.getPrototypeOf(async function*() {})
  .constructor;

const defineCell = (
  cell: any,
  source: string
): { cellFunction: any; cellName: string; cellReferences: string[] } => {
  let name = null;
  if (cell.id && cell.id.name) name = cell.id.name;
  if (cell.body.type === "ImportDeclaration") {
    throw Error(`Pls implement import handling`);
  }
  const bodyText = source.substring(cell.body.start, cell.body.end);
  let code;
  if (cell.body.type !== "BlockStatement") {
    if (cell.async)
      code = `return (async function(){ return (${bodyText});})()`;
    else code = `return (function(){ return (${bodyText});})()`;
  } else code = bodyText;
  const references = cell.references.map(ref => {
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
  cellFunction: (...any) => any
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
      // run recipe if no file or if it's out of date
      if (currCell.stat === null) {
        console.log(
          `Running recipe for ${currCell.path} because it doesnt exist`
        );
        await currCell.runRecipe();
        currCell.stat = await getStat(currCell.path);
        return currCell;
      }
      const deps = cellDependents.filter(
        c => currCell.stat.mtime < c.stat.mtime
      );
      if (deps.length > 0) {
        console.log(`Re-running recipe for ${currCell.path} because:`);
        deps.map(d => console.log(`\t${d.path}`));
        await currCell.runRecipe();
        currCell.stat = await getStat(currCell.path);
        return currCell;
      } else {
        console.log(`no need to re-run recipe for ${currCell.path}`);
      }
    }
    return currCell;
  };
};

const oakDefine = (
  oakfileModule: any,
  source: string
): ((runtime: any, observer: any) => any) => {
  return function define(runtime, observer) {
    const main = runtime.module();

    oakfileModule.cells.map(cell => {
      if (cell.body.type === "ViewEpression") {
        // const defineImportCell =
      } else {
        const { cellName, cellFunction, cellReferences } = defineCell(
          cell,
          source
        );

        main
          .variable(observer())
          .define(cellName, cellReferences, defineCellDefinition(cellFunction));
      }
    });
    return main;
  };
};

export async function oak_static(args: { filename: string }) {
  const runtime = new Runtime(new Library());
  const parseResults = await parseOakfile(args.filename);
  const oakfileModule = parseResults.module;
  const oakfileContents = parseResults.contents;
  const define = oakDefine(oakfileModule, oakfileContents);
  runtime.module(define, (name: string) => {
    return true;
  });
}
