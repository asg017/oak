import { oak_run, defaultHookEmitter } from "../../core/run";
import { EventEmitter } from "events";
import { runInkApp } from "./ui";

export async function runCommand(args: {
  filename: string;
  targets: readonly string[];
  dash?: boolean;
}) {
  const runEvents = new EventEmitter();

  const { unmount } = runInkApp(runEvents);

  process.on("SIGINT", () => {
    unmount();
  });

  const hooks = defaultHookEmitter(runEvents);
  await oak_run({
    filename: args.filename,
    targets: args.targets,
    schedule: false,
    hooks,
  });
  unmount();
}
