import test from "tape";
import { removeSync } from "fs-extra";
import { oak_run } from "../../src/core/run";
import { envFile, open } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env(".oak"));
  removeSync(env("oak_data"));
  removeSync(env("sub/oak_data"));
  removeSync(env("sub/subsub/oak_data"));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

test("oak-run simple-import", async t => {
  await oak_run({
    filename: env("Oakfile"),
    targets: []
  });
  const a_file = await open(env("sub/subsub/oak_data/a"));
  const b_file = await open(env("sub/oak_data/b"));
  const c_file = await open(env("sub/oak_data/c"));
  const d_file = await open(env("oak_data/d"));
  const f_file = await open(env("oak_data/f"));
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
