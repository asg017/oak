import { spawn } from "child_process";
import { EventEmitter } from "events";
import * as log from "npmlog";

const executeCommand = (command: string) => {
  const e = new EventEmitter();
  const process = spawn(command, { shell: true });
  log.info("oak-stdlib shell", command);
  process.stdout.on("data", chunk => {
    e.emit("stdout", chunk);
  });
  process.stderr.on("data", chunk => {
    e.emit("stderr", chunk);
  });

  process.on("exit", async code => {
    e.emit("exit", code);
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
        ? `${values[i]}${strings[i + 1]}`
        : `"${values[i].target.replace(`"`, `"`)}"${strings[i + 1]}`;
  return new Promise((resolve, reject) =>
    executeCommand(s)
      .on("stdout", chunk => {
        //process.stdout.write(chunk);
        log.info("oak-stdlib shell chunk", chunk);
      })
      .on("stderr", chunk => {
        //process.stderr.write(chunk);
        log.error("oak-stdlib shell chunk", chunk);
      })
      .on("exit", async code => {
        if (code === 0) return resolve(s);
        return reject(code);
      })
      .on("error", () => {
        process = null;
        reject("error");
      })
  );
}

export default function shell(args = {}) {
  return Array.isArray(args)
    ? ((args = {}), transform.apply(this, arguments))
    : transform;
}
