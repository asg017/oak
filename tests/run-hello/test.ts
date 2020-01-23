import test from "tape";
import { oak_run } from "../../src/commands/run";
import { cleanUp, envFile, open, touch } from "../utils";

const env = envFile(__dirname);

const outs = ["a", "b", "c"];

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

test("oak-run hello", async t => {
  await oak_run({ filename: env("Oakfile"), targets: [] });
  const a_file = await open(env("a"));
  const b_file = await open(env("b"));
  const c_file = await open(env("c"));
  t.equal(a_file.content, "a");
  t.equal(b_file.content, "b");
  t.equal(c_file.content, "ab");
  t.true(a_file.stat.mtime < c_file.stat.mtime);
  t.true(b_file.stat.mtime < c_file.stat.mtime);

  await touch(env("b"), b_file.stat.atime, c_file.stat.mtime);

  await oak_run({ filename: env("Oakfile"), targets: [] });
  const new_a_file = await open(env("a"));
  const new_b_file = await open(env("b"));
  const new_c_file = await open(env("c"));

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
