import { oak_run, defaultHookEmitter } from "../../core/run";
import { EventEmitter } from "events";
import { runInkApp } from "./ui";

export default async function runCommand(args: {
  filename: string;
  targets: readonly string[];
  dash?: boolean;
}) {
  const runEvents = new EventEmitter();

  runInkApp(runEvents);

  const hooks = defaultHookEmitter(runEvents);
  await oak_run({
    filename: args.filename,
    targets: args.targets,
    schedule: false,
    hooks,
  });
}
