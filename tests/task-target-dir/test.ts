import test from "tape";
import { oak_run } from "../../src/commands/run";
import { envFile } from "../utils";

const env = envFile(__dirname);

test("task-target-dir", async t => {
  await oak_run({ filename: env("Oakfile"), targets: [] });
});
