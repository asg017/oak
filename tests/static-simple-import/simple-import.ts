import * as test from "tape";
import { oak_static } from "../../src/oak-static";
import { cleanUp, envFile, open } from "../utils";

const outs = ["sub/subsub/a", "sub/b", "sub/c", "d", "f"];
const env = envFile(__dirname);

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

test("oak-static simple-import", async t => {
  await oak_static({
    filename: env("Oakfile"),
    targets: []
  });
  const a_file = await open(env("sub/subsub/a"));
  const b_file = await open(env("sub/b"));
  const c_file = await open(env("sub/c"));
  const d_file = await open(env("d"));
  const f_file = await open(env("f"));
  t.equal(a_file.content, "a");
  t.equal(b_file.content, "b");
  t.equal(c_file.content, "ab");
  t.equal(d_file.content, "ab");
  t.equal(f_file.content, "fff");
  t.true(a_file.stat.mtime < c_file.stat.mtime);
  t.true(b_file.stat.mtime < c_file.stat.mtime);
  t.true(c_file.stat.mtime < d_file.stat.mtime);
  t.end();
});
