import { spawn } from "child_process";
import { EventEmitter } from "events";

const executeCommand = (command: string) => {
  const e = new EventEmitter();
  const process = spawn(command, { shell: true });
  // console.log(`[executeCommand] running command ${command}`);
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
function transform(strings: string[], ...values: any[]): Promise<string> {
  let s = strings[0];
  for (let i = 0, n = values.length; i < n; ++i)
    s +=
      typeof values[i] === "string"
        ? `"${values[i].replace(`"`, `"`)}"${strings[i + 1]}`
        : `"${values[i].path.replace(`"`, `"`)}"${strings[i + 1]}`;
  console.log(s);
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

export default function bash(args = {}) {
  return Array.isArray(args)
    ? ((args = {}), transform.apply(this, arguments))
    : transform;
}
