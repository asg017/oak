import { Runtime } from "@observablehq/runtime";
import { spawn } from "child_process";
import { OakInspector } from "./oak-inspector";
import { createLogger } from "./logging";
import { getStat, loadOakfile } from "./utils";
import { EventEmitter } from "events";

import { OakVariableType, OakType } from "./types";

type StatType = {
  mtime: number;
};

type OakVariableWithStat = {
  oakVariable: OakVariableType;
  stat: StatType;
};
const oakLogger = createLogger({ label: "Oak" });

const runRecipe = (recipe: string) => {
  const e = new EventEmitter();
  const process = spawn(recipe, { shell: true });
  console.log(`running recipe ${recipe}`);
  process.stdout.on("data", chunk => {
    e.emit("stdout", chunk);
  });
  process.stderr.on("data", chunk => {
    e.emit("stderr", chunk);
  });

  process.on("close", async code => {
    e.emit("close", code);
  });
  process.on("error", () => {
    e.emit("error");
  });
  return e;
};

function performRecipe(
  oakVariable: OakVariableType
): Promise<OakVariableWithStat> {
  return new Promise((res, rej) => {
    runRecipe(oakVariable.recipe)
      .on("stdout", chunk => {})
      .on("stderr", chunk => {})
      .on("close", async code => {
        console.info(`Process closing with code ${code}`);
        const stat = await getStat(oakVariable.filename).catch(e => {
          oakLogger.error(
            `Error reading stat for ${oakVariable.filename} (2nd attempt): ${e}`
          );
          throw e;
          return null;
        });
        res({ oakVariable, stat });
      })
      .on("error", () => {
        process = null;
        console.error(`Process errored`);
        rej("error");
      });
  });
}

function createVariableDefinition(
  oakVariable: OakVariableType
): (...variableDependenciesX: OakVariableWithStat[]) => Promise<object> {
  return async function(...variableDependencies: OakVariableWithStat[]) {
    let process;

    let stat = await getStat(oakVariable.filename).catch(e => {
      // TODO check error code, only "file not exists" error
      oakLogger.error(
        `Error reading stat for ${oakVariable.filename} (intial): ${e}`
      );
      return null;
    });
    // ideally, this would only happen at most once, because the target file doesnt
    // exist yet. after running the recipe, the target should exist
    if (stat === null) {
      oakLogger.info(
        `[${
          oakVariable.name
        }] running recipe - bc inital stat not available - "${
          oakVariable.recipe
        }"`
      );
      return performRecipe(oakVariable);
    }

    const updatedDeps = variableDependencies.filter(
      dep => dep.stat.mtime > stat.mtime
    );
    if (updatedDeps.length > 0) {
      oakLogger.debug(
        `${oakVariable.name} is out of date because ${
          updatedDeps.length
        } dependenices (${updatedDeps
          .map(dep => dep.oakVariable.filename)
          .join(",")}) have updated. Calling recipe '${oakVariable.recipe}'`
      );
      return performRecipe(oakVariable);
    }
    return new Promise(function(res, rej) {
      res({ oakVariable, stat });
    });
  };
}

type OakStaticArgumentsType = {
  filename: string;
  targets: readonly string[];
};

export async function oak_static(args: OakStaticArgumentsType) {
  const runtime = new Runtime();
  const inspector = new OakInspector(null, "default");
  const m = runtime.module();
  const oak: OakType = await loadOakfile({
    path: args.filename,
    cleanRecipe: true
  });
  oak.variables.map(variable => {
    const variableDefinition = createVariableDefinition(variable);
    m.variable(new OakInspector(null, variable.name)).define(
      variable.name,
      variable.deps,
      variableDefinition
    );
  });
}
