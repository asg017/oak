import test from "tape";
import { removeSync } from "fs-extra";
import { oak_run } from "../../src/core/run";
import { envFile, open, touch } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env.data(""));
  removeSync(env(".oak"));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

test("oak-run hello", async t => {
  await oak_run({ filename: env("Oakfile"), targets: [] });
  const a_file = await open(env.data("a"));
  const b_file = await open(env.data("b"));
  const c_file = await open(env.data("c"));
  t.equal(a_file.content, "a");
  t.equal(b_file.content, "b");
  t.equal(c_file.content, "ab");
  t.true(a_file.stat.mtime < c_file.stat.mtime);
  t.true(b_file.stat.mtime < c_file.stat.mtime);

  await touch(env.data("b"), b_file.stat.atime, c_file.stat.mtime);

  await oak_run({ filename: env("Oakfile"), targets: [] });
  const new_a_file = await open(env.data("a"));
  const new_b_file = await open(env.data("b"));
  const new_c_file = await open(env.data("c"));

  t.equal(
    a_file.stat.mtime.getTime(),
    new_a_file.stat.mtime.getTime(),
    "a should not update"
  );
  t.true(
    new_c_file.stat.mtime > new_b_file.stat.mtime,
    "new_c should be updated after new_b"
  );
  t.true(
    new_c_file.stat.mtime > c_file.stat.mtime,
    "new_c should be updated after c"
  );
  t.end();
});
