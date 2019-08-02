import { parseModule } from "@observablehq/parser";
import { Runtime } from "@observablehq/runtime";
import Library, { FileInfo, getStat } from "./Library";
import { readFile } from "fs";

const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
const GeneratorFunction = Object.getPrototypeOf(function*() {}).constructor;
const AsyncGeneratorFunction = Object.getPrototypeOf(async function*() {})
  .constructor;

export async function oak_static(args: { filename: string }) {
  const runtime = new Runtime(Library, {});
  const inspector = {
    pending() {
      console.log(`pending`);
    },
    fulfilled(value) {
      console.log(`${value} fulfilled`);
    },
    rejected(error) {
      console.error(`${error} rejected`);
    }
  };

  const oakfileContents: string = await new Promise((resolve, reject) => {
    readFile(args.filename, "utf8", (err: any, contents: string) => {
      if (err) reject(err);
      resolve(contents);
    });
  });
  const parseResults = parseModule(oakfileContents);

  const m = runtime.module();

  parseResults.cells.map(cell => {
    let name = null;
    if (cell.id && cell.id.name) name = cell.id.name;
    if (cell.body.type === "ImportDeclaration") {
      throw Error(`Pls implement import handling`);
    }
    const bodyText = oakfileContents.substring(cell.body.start, cell.body.end);
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
    m.variable(inspector).define(name, references, async function(
      ...dependencies
    ) {
      // dont try and get fileinfo for cell depends like `cell` or `bash`
      let cellDependents = [];
      dependencies.map(dependency => {
        if (dependency instanceof FileInfo) {
          cellDependents.push(dependency);
        }
      });
      let currCell = await f(...dependencies);

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
    });
  });
}
