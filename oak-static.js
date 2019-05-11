fs = require("fs");
const { Runtime } = require("@observablehq/runtime");
const { Library } = require("@observablehq/stdlib");
const { spawn } = require("child_process");
const { OakInspector } = require("./oak-inspector.js");
const { createLogger } = require("./logging.js");
const EventEmitter = require("events");

const oakLogger = createLogger({ label: "Oak" });

const loadOakfile = (config = {}) => {
  const { path = "Oakfile", cleanRecipe = true } = config;
  return new Promise(function(resolve, reject) {
    fs.readFile(path, "utf8", (err, contents) => {
      if (err) reject(err);
      let oak;
      try {
        oak = JSON.parse(contents);
      } catch (err) {
        console.error(err);
        reject(err);
        return;
      }
      if (cleanRecipe) {
        for (let key in oak.variables) {
          let { recipe } = oak.variables[key];
          for (let key2 in oak.variables) {
            recipe = recipe.replace(
              `\${${key2}}`,
              oak.variables[key2].filename
            );
          }
          oak.variables[key].recipe = recipe;
        }
      }
      resolve(oak);
    });
  });
};

const getStat = filename =>
  new Promise(function(resolve, reject) {
    fs.stat(filename, (err, stat) => {
      if (err) reject(err);
      resolve(stat);
    });
  });

const runtime = new Runtime();
const inspector = new OakInspector();
const m = runtime.module();
const runRecipe = recipe => {
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
        return new Promise((resolve, reject) => {
          process = runRecipe(recipe)
            .on("stdout", chunk => {})
            .on("stderr", chunk => {})
            .on("close", async code => {
              process = null;
              processLogger.info(`Process closing with code ${code}`);

              const stat = await getStat(variable.filename).catch(e => {
                oakLogger.error(
                  `Error reading stat for ${
                    variable.filename
                  } (2nd attempt): ${e}`
                );
                throw e;
              });
              reject(stat);
            })
            .on("error", () => {
              process = null;
              processLogger.error(`Process errored`);
              reject("error");
            });
        });
      }
      const updatedDeps = variableDependencies.filter(
        dep => dep.mtime > stat.mtime
      );
      if (updatedDeps.length > 0) {
        return new Promise(function(resolve, reject) {
          oakLogger.debug(
            `${key} is out of date because ${
              updatedDeps.length
            } dependices have updated. Calling recipe ${variable.recipe}`
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
                  `Error reading stat for ${
                    variable.filename
                  } (2nd attempt): ${e}`
                );
                throw e;
                return null;
              });
              resolve(stat2);
            })
            .on("error", () => {
              process = null;
              processLogger.error(`Process errored`);
              reject("error2");
            });
        });
      }
      return new Promise(function(resolve, reject) {
        resolve(stat);
      });
    });
  });
});
