import * as test from "tape";
import { oak_static } from "../../src/oak-static";
import { cleanUp, input_file, open } from "../utils";

const outs = ["sub/a", "sub/b", "sub/c", "d", "f"];

test.onFinish(() => {
  cleanUp(input_file.simple_import, outs);
});

cleanUp(input_file.simple_import, outs);
test("oak-static simple-import", async t => {
  await oak_static({
    filename: input_file.simple_import("Oakfile"),
    targets: []
  });
  const a_file = await open(input_file.simple_import("sub/a"));
  const b_file = await open(input_file.simple_import("sub/b"));
  const c_file = await open(input_file.simple_import("sub/c"));
  const d_file = await open(input_file.simple_import("d"));
  const f_file = await open(input_file.simple_import("f"));
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
