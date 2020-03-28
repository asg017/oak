import test from "tape";
import { oak_run } from "../../src/commands/run";
import { envFile, open, touch } from "../utils";
import { removeSync } from "fs-extra";
import { join } from "path";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env.data(""));
  removeSync(env(".oak"));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

test("task-target-dir", async t => {
  await oak_run({ filename: env("Oakfile"), targets: [] });

  const a0 = await open(env.data(join("a", "file0")));
  const a4 = await open(env.data(join("a", "file4")));
  const origB = await open(env.data("b.txt"));

  t.equals(a0.content, "a0");
  t.equals(a4.content, "a4");
  t.equals(origB.content, "a0a1a2a3a4");

  // touch a file in a_dir. Now, on next oak run, b will update
  await touch(env.data(join("a", "file1")), origB.stat.atime, origB.stat.mtime);
  await oak_run({ filename: env("Oakfile"), targets: [] });

  const newB = await open(env.data("b.txt"));
  t.true(newB.stat.mtime > origB.stat.mtime);
  t.end();
});
