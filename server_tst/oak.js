fs = require("fs");
const { Runtime } = require("@observablehq/runtime");
const { spawn } = require("child_process");
const child = spawn("ls", ["-lh", "/usr"]);

const runtime = new Runtime();

class CustomInspector {
  constructor(socket) {
    this.socket = socket;
    console.log(`CustomInspector constructor called`);
  }

  pending() {
    console.log(`${this.socket}|CustomInspector pending called`);
  }

  fulfilled(value, name) {
    console.log(`CustomInspector fulfilled called, ${value}|${name}`);
  }

  rejected(error, name) {
    console.log(`CustomInspector rejected called, ${error}|${name}`);
  }
}

const inspector = new CustomInspector();
const m = runtime.module();

fs.readFile("Oakfile", "utf8", (err, contents) => {
  if (err) throw err;
  const oak = JSON.parse(contents);

  Object.keys(oak.variables).map(key => {
    const variable = oak.variables[key];
    console.log(variable);
    m.variable(new CustomInspector(key)).define(key, variable.deps, function() {
      console.log(`lol ${arguments.length}`);
      for (let i = 0; i < arguments.length; i++) {
        console.log(`\targument[${i}]="${arguments[i]}"`);
      }
      //console.log(arguments[1]);
      const { recipe } = variable;
      const cmd = recipe.split(" ");
      const child = spawn(cmd[0], cmd.slice(1));
      child.stdout.on("data", chunk => {
        console.log("chunk", key, `${chunk}`);
      });

      child.on("close", code => {
        console.log(`child process exited with code ${code}`);
      });
      return `xXx${key}xXx`;
    });
  });
});
