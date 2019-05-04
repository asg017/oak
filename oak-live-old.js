fs = require("fs");
const { Runtime } = require("@observablehq/runtime");
const { Library } = require("@observablehq/stdlib");
const { spawn } = require("child_process");
const { OakInspector } = require("./oak-inspector.js");
const { createLogger } = require("./logging.js");
const EventEmitter = require("events");

const socketLogger = createLogger({ label: "Socket" });
const oakLogger = createLogger({ label: "Oak" });

const Generators = new Library().Generators;
const server = require("http").createServer();
const io = require("socket.io")(server);
const port = 3000;

const argLive = process.argv[2] === "live";

console.log(argLive);
io.on("connection", socket => {
  socketLogger.info(`[${socket.id}] connection made`);
  socket.emit("oakfile", Oak);
  socket.on("disconnect", socket => {
    socketLogger.info(`[${socket.id}] disconnected!`);
  });
});

server.listen(port, () =>
  socketLogger.info(`socket.io update server listening on ${port}!`)
);

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
const inspector = new OakInspector(io);
const m = runtime.module();
const runRecipe = recipe => {
  const e = new EventEmitter();
  const process = spawn(recipe, { shell: true });
  console.log("run recipe please");
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
    m.variable(new OakInspector(io, key)).define(
      key,
      [...deps, "invalidation"],
      async function*() {
        const variableDependencies = Array.from(arguments).slice(
          0,
          arguments.length - 1
        );
        const invalidation = arguments[arguments.length - 1];
        let process;
        let processLogger = oakLogger.child({ label: `process-${key}` });
        const watch = (curr, prev) => {
          oakLogger.info(`${key} file UPDATE ${curr.size} ${prev.size}`);
          change(curr);
        };
        fs.watchFile(filename, { persistent: false, interval: 500 }, watch);

        invalidation.then(() => {
          oakLogger.info(
            `${key} invalidated, unwatching ${filename}, proc=${process}`
          );
          fs.unwatchFile(filename, watch);
          //if (process) process.kill();
        });

        let stat = await getStat(variable.filename).catch(e => {
          // TODO check error code, only "file not exists" error
          oakLogger.error(
            `Error reading stat for ${variable.filename} (intial): ${e}`
          );
          return null;
        });
        console.log(key, stat);

        // ideally, this would only happen at most once, because the target file doesnt
        // exist yet. after running the recipe, the target should exist
        if (stat === null) {
          oakLogger.info(
            `[${key}] running recipe - bc inital stat not available - "${recipe}"`
          );
          process = runRecipe(recipe)
            .on("stdout", chunk => {
              io.emit("chunk", { key, chunk });
            })
            .on("stderr", chunk => {
              io.emit("stderr", { key, chunk });
            })
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
              change(stat);
            })
            .on("error", () => {
              process = null;
              processLogger.error(`Process errored`);
            });
        } else {
          const updatedDeps = variableDependencies.filter(
            dep => dep.mtime > stat.mtime
          );
          console.log(updatedDeps.length);
          if (updatedDeps.length > 0) {
            oakLogger.debug(
              `${key} is out of date because ${
                updatedDeps.length
              } dependices have updated. Calling recipe ${variable.recipe}`
            );
            processLogger.info(`spawning process with "${recipe}"`);
            process = runRecipe(recipe)
              .on("stdout", chunk => {
                io.emit("chunk", { key, chunk });
              })
              .on("stderr", chunk => {
                io.emit("stderr", { key, chunk });
              })
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
                change(stat2);
              })
              .on("error", () => {
                process = null;
                processLogger.error(`Process errored`);
              });
          } else {
            change(stat);
          }
        }

        return () => {
          oakLogger.debug(`plese, queue dispose ${filename}`);
          fs.unwatchFile(filename, watch);
        };
      }
    );
  });
});
