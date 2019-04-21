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
  socket.on("disconnect", socket => {
    console.log("disconnected!");
  });
});

server.listen(port, () =>
  console.log(`socket.io update server listening on ${port}!`)
);

const runtime = new Runtime();
const inspector = new OakInspector();
const m = runtime.module();

fs.readFile("Oakfile", "utf8", (err, contents) => {
  if (err) throw err;
  const oak = JSON.parse(contents);

  for (let key in oak.variables) {
    let { recipe } = oak.variables[key];
    for (let key2 in oak.variables) {
      recipe = recipe.replace(`\${${key2}}`, oak.variables[key2].filename);
    }
    console.log(`New recipe: ${recipe}`);
    oak.variables[key].recipe = recipe;
  }

  Object.keys(oak.variables).map(key => {
    const variable = oak.variables[key];
    console.log(variable);
    const { recipe, filename, deps } = variable;
    deps.push("invalidation");
    m.variable(inspector).define(key, deps, function() {
      return Generators.observe(change => {
        for (let i = 0; i < arguments.length; i++) {
          console.log(
            `\t${key}|argument[${i}]="${arguments[i]}" ${i !==
              arguments.length - 1 && oak.variables[arguments[i]].filename}`
          );
        }
        const watch = (curr, prev) => {
          console.log(`${key} file update???`);
          change(key);
        };
        fs.watchFile(filename, { persistent: false, interval: 1000 }, watch);

        arguments[arguments.length - 1].then(() => {
          fs.unwatchFile(filename, watch);
          console.log(
            "########################################################################## invalidate???"
          );
        });
        //console.log(arguments[1]);
        const cmd = recipe.split(" ");
        const child = spawn(recipe, {
          shell: true
        });

        child.stdout.on("data", chunk => {
          console.log("chunk", key, `${chunk}`);
        });

        change(
          new Promise((resolve, reject) => {
            child.on("close", code => {
              //console.log(`child process exited with code ${code}`);
              resolve(`${key}`);
            });
            child.on("error", () => {
              reject(`${key}`);
            });
          })
        );
        return () => fs.unwatchFile(filename, watch);
      });
    });
  });
});
