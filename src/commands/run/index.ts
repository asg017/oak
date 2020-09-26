import { oak_run, defaultHookEmitter } from "../../core/run";
import { EventEmitter } from "events";
import { runInkApp } from "./ui";

export async function runCommand(args: {
  filename: string;
  redefines: readonly string[];
  targets: readonly string[];
}) {
  const runEvents = new EventEmitter();
  const hooks = defaultHookEmitter(runEvents);
  let unmountApp;

    ({ unmount: unmountApp } = runInkApp(runEvents));

    process.on("SIGINT", () => {
      unmountApp();
    });
  await oak_run({
    filename: args.filename,
    redefines: args.redefines,
    targets: args.targets,
    hooks,
  });
  if (unmountApp) unmountApp();
}
