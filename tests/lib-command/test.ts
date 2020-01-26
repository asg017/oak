import test from "tape";
import {removeSync} from 'fs-extra';
import { oak_run } from "../../src/commands/run";
import { envFile, open } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env('oak_data'));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

test("lib-command", async t => {
  await oak_run({ filename: env("Oakfile"), targets: [] });
  const a_file = await open(env("oak_data/a"));
  const b_file = await open(env("oak_data/b"));
  const c_file = await open(env("oak_data/c"));
  t.equal(a_file.content, "a");
  t.equal(b_file.content, "b");
  t.equal(c_file.content, "ab");
  t.true(a_file.stat.mtime < c_file.stat.mtime);
  t.true(b_file.stat.mtime < c_file.stat.mtime);
  t.end();
});
