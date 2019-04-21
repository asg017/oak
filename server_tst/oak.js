fs = require("fs");
const { Runtime } = require("@observablehq/runtime");
const { Library } = require("@observablehq/stdlib");
const { spawn } = require("child_process");
const { OakInspector } = require("./oak-inspector.js");
const { createLogger } = require("./logging.js");

const socketLogger = createLogger({ label: "Socket" });
const oakLogger = createLogger({ label: "Oak" });

const Generators = new Library().Generators;
const server = require("http").createServer();
const io = require("socket.io")(server);
const port = 3000;

io.on("connection", socket => {
  socketLogger.info(`connection made ${socket.id}`);
  socket.emit("oakfile", Oak);
  socket.on("disconnect", socket => {
    socketLogger.info(`${socket.id} disconnected!`);
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
          console.log(`New recipe: ${recipe}`);
          oak.variables[key].recipe = recipe;
        }
      }
      resolve(oak);
    });
  });
};

const runtime = new Runtime();
const inspector = new OakInspector(io);
const m = runtime.module();
let Oak;
loadOakfile().then(oak => {
  Object.keys(oak.variables).map(key => {
    const variable = oak.variables[key];
    oakLogger.info(variable);
    const { recipe, filename, deps } = variable;
    m.variable(new OakInspector(io, key)).define(
      key,
      [...deps, "invalidation"],
      function() {
        const invalidation = arguments[arguments.length - 1];
        let process;
        let processLogger = oakLogger.child({ label: `process-${key}` });
        return Generators.observe(change => {
          const watch = (curr, prev) => {
            oakLogger.info(`${key} file update???`);
            change(key);
          };
          fs.watchFile(filename, { persistent: false, interval: 500 }, watch);

          invalidation.then(() => {
            oakLogger.info(`${key} invalidated`);
            fs.unwatchFile(filename, watch);
            if (process) process.kill();
          });
          process = spawn(recipe, { shell: true });

          process.stdout.on("data", chunk => {
            processLogger.info(chunk);
            io.emit("chunk", { key, chunk });
          });

          process.on("close", code => {
            process = null;
            //console.log(`child process exited with code ${code}`);
          });
          process.on("error", () => {
            process = null;
          });

          return () => fs.unwatchFile(filename, watch);
        });
      }
    );
  });
});
