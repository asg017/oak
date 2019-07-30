import { spawn } from "child_process";
import { EventEmitter } from "events";

const executeCommand = (command: string) => {
  const e = new EventEmitter();
  const process = spawn(command, { shell: true });
  console.log(`[executeCommand]running command ${command}`);
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

export function bash(args = {}) {
  function transform(strings: string[], ...values: any[]): Promise<string> {
    let s = strings[0];
    for (let i = 0, n = values.length; i < n; ++i)
      s += `"${values[i].replace(`"`, `"`)}"${strings[i + 1]}`;

    return new Promise((resolve, reject) =>
      executeCommand(s)
        .on("stdout", chunk => {
          process.stdout.write(chunk);
        })
        .on("stderr", chunk => {
          process.stderr.write(chunk);
        })
        .on("close", async code => {
          resolve(s);
        })
        .on("error", () => {
          process = null;
          console.error(`Process errored`);
          reject("error");
        })
    );
  }
  return Array.isArray(args)
    ? ((args = {}), transform.apply(this, arguments))
    : transform;
}

export default function Library() {
  Object.defineProperties(this, {
    // bash: bash
  });
}

import { Runtime } from "@observablehq/runtime";
const rt = new Runtime({ bash });
const m1 = rt.module();

m1.variable({
  pending() {
    console.log("pending...");
  }
}).define(
  "test",
  ["bash"],
  async bash => await bash`echo "hello world! inside bash\`\`"`
);
m1.variable({
  pending() {
    console.log("pendingX...");
  }
}).define("asdf", ["test"], () => console.log(`nuthin`));
