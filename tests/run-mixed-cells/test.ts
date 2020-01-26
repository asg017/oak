import test from "tape";
import {removeSync} from 'fs-extra';
import { oak_run } from "../../src/commands/run";
import { open, envFile } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env('oak_data'));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

test("run-mixed-cell", async t => {
  await oak_run({ filename: env("Oakfile"), targets: [] });
  t.equals((await open(env("oak_data/a.txt"))).content, "a");
  t.equals((await open(env("oak_data/b.txt"))).content, "a");
  t.end();
});
