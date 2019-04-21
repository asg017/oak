fs = require("fs");
const { Runtime } = require("@observablehq/runtime");
const { Library } = require("@observablehq/stdlib");
const { spawn } = require("child_process");
const { OakInspector } = require("./oak-inspector.js");

const Generators = new Library().Generators;
const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = 3000;

app.get("/", (req, res) => {
  res.send("hello");
});

app.post("/update", (req, res) => {
  console.log("updated endpoint hit");

  io.emit("update", "spooky");

  res.send("updated");
});

io.on("connection", socket => {
  console.log("connection!");
  socket.emit("oakfile", Oak);
  socket.on("disconnect", socket => {
    console.log("disconnected!");
  });
});

server.listen(port, () =>
  console.log(`socket.io update server listening on ${port}!`)
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
    console.log(variable);
    const { recipe, filename, deps } = variable;
    m.variable(new OakInspector(io, key)).define(
      key,
      [...deps, "invalidation"],
      function() {
        const invalidation = arguments[arguments.length - 1];
        let process;
        return Generators.observe(change => {
          const watch = (curr, prev) => {
            console.log(`${key} file update???`);
            change(key);
          };
          fs.watchFile(filename, { persistent: false, interval: 500 }, watch);

          invalidation.then(() => {
            console.log(`${key} invalidated`);
            fs.unwatchFile(filename, watch);
            if (process) process.kill();
          });
          process = spawn(recipe, { shell: true });

          process.stdout.on("data", chunk => {
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
