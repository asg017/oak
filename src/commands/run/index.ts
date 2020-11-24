//import { oak_run, defaultHookEmitter } from "../../core/run";
import { EventEmitter } from "events";
import { runInkApp } from "./ui";
import { fork } from "child_process";
import { dirname, join } from "path";
import { createInterface } from "readline";
import { createWriteStream } from "fs";
import { hashString } from "../../utils";
import { fileArgument } from "../../cli-utils";
import { mkdirsSync } from "fs-extra";

export async function runCommand(args: {
  filename: string;
  redefines: readonly string[];
  targets: readonly string[];
}) {
  const runEvents = new EventEmitter();
  
  const runHash = hashString(`${Math.random()}`);

  let app;
  if(process.stdout.isTTY) 
  app = runInkApp(runEvents, runHash);
  const oakfilePath = fileArgument(args.filename);

  const oakLogPath = join(
    dirname(oakfilePath),
    ".oak",
    "oak-logs",
    `${runHash}.log`
  );
  mkdirsSync(dirname(oakLogPath));
  let oakLogStream = createWriteStream(oakLogPath);

  process.on("SIGINT", () => {
    if(app)
      app.unmount();
  });
  const runProcess = fork(
    join(__dirname, "fork"),
    [args.filename, ...args.targets],
    { silent: true }
  );
  runProcess.stdout.pipe(oakLogStream);
  createInterface({
    input: runProcess.stdout,
  })
    .on("line", line => {
      try {
        const data = JSON.parse(line);
        runEvents.emit("log", data);
      } catch (e) {
        console.error(e);
      }
    })
    .on("close", () => {
      runEvents.emit("close");
      if(app)
        app.unmount();
    });
}
