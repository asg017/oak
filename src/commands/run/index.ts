import { oak_run, defaultHookEmitter } from "../../core/run";
import { EventEmitter } from "events";
import { runInkApp } from "./ui";

export async function runCommand(args: {
  filename: string;
  targets: readonly string[];
  stdout: string;
  stdin: string;
  dash?: boolean;
}) {
  if (args.stdout && args.dash) {
    throw Error('"stdout" and "dash" cannot both be specified.');
  }
  const runEvents = new EventEmitter();
  const hooks = defaultHookEmitter(runEvents);
  let unmountApp;

  if (!args.stdout) {
    ({ unmount: unmountApp } = runInkApp(runEvents));

    process.on("SIGINT", () => {
      unmountApp();
    });
  }
  await oak_run({
    filename: args.filename,
    targets: args.targets,
    stdout: args.stdout,
    stdin: args.stdin,
    schedule: false,
    hooks,
  });
  if (unmountApp) unmountApp();
}
