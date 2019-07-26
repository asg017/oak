import { Runtime } from "@observablehq/runtime";
import { Library } from "@observablehq/stdlib";
import { spawn } from "child_process";
import { OakInspector } from "./oak-inspector";
import { createLogger } from "./logging.js";
import { getStat, loadOakfile } from "./utils.js";

import {EventEmitter} from "events";

const oakLogger = createLogger({ label: "Oak" });

export function oak_static(argv) {
  const runtime = new Runtime();
  const inspector = new OakInspector(null, 'default');
  const m = runtime.module();

  const runRecipe = (recipe : string) => {
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
  let Oak;
  console.log("TODO in oak_static, argv:");
  console.log(argv);
  loadOakfile().then(oak => {
    Oak = oak;
    Object.keys(oak.variables).map(key => {
      const variable = oak.variables[key];
      const { recipe, filename, deps } = variable;
      m.variable(new OakInspector(null, key)).define(key, deps, async function(
        variableDependencies
      ) {
        let process;
        let processLogger = oakLogger.child({ label: `process-${key}` });

        let stat = await getStat(variable.filename).catch(e => {
          // TODO check error code, only "file not exists" error
          oakLogger.error(
            `Error reading stat for ${variable.filename} (intial): ${e}`
          );
          return null;
        });

        // ideally, this would only happen at most once, because the target file doesnt
        // exist yet. after running the recipe, the target should exist
        if (stat === null) {
          oakLogger.info(
            `[${key}] running recipe - bc inital stat not available - "${recipe}"`
          );
          return new Promise((res, rej) => {
            process = runRecipe(recipe)
              .on("stdout", chunk => {})
              .on("stderr", chunk => {})
              .on("close", async code => {
                process = null;
                processLogger.info(`Process closing with code ${code}`);

                const stat = await getStat(variable.filename).catch(e => {
                  oakLogger.error(
                    `Error reading stat for ${variable.filename} (2nd attempt): ${e}`
                  );
                  throw e;
                });
                rej(stat);
              })
              .on("error", () => {
                process = null;
                processLogger.error(`Process errored`);
                rej("error");
              });
          });
        }
        const updatedDeps = variableDependencies.filter(
          dep => dep.mtime > stat.mtime
        );
        if (updatedDeps.length > 0) {
          return new Promise(function(res, rej) {
            oakLogger.debug(
              `${key} is out of date because ${updatedDeps.length} dependices have updated. Calling recipe ${variable.recipe}`
            );
            processLogger.info(`spawning process with "${recipe}"`);
            process = runRecipe(recipe)
              .on("stdout", chunk => {})
              .on("stderr", chunk => {})
              .on("close", async code => {
                process = null;
                //console.log(`child process exited with code ${code}`);
                processLogger.info(`Process closing with code ${code}`);

                const stat2 = await getStat(variable.filename).catch(e => {
                  oakLogger.error(
                    `Error reading stat for ${variable.filename} (2nd attempt): ${e}`
                  );
                  throw e;
                  return null;
                });
                res(stat2);
              })
              .on("error", () => {
                process = null;
                processLogger.error(`Process errored`);
                rej("error2");
              });
          });
        }
        return new Promise(function(res, rej) {
          res(stat);
        });
      });
    });
  });
}