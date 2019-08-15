import * as test from "tape";
import { oak_static } from "../../src/oak-static";
import { cleanUp, input_file, open } from "../utils";

const outs = ["sub/a", "sub/b", "sub/c", "a", "d"];

test.onFinish(() => {
  cleanUp(input_file.simple_inject, outs);
});

cleanUp(input_file.simple_inject, outs);
test("oak-static simple-inject", async t => {
  await oak_static({
    filename: input_file.simple_inject("Oakfile"),
    targets: []
  });
  const a_file = await open(input_file.simple_inject("sub/a"));
  const b_file = await open(input_file.simple_inject("sub/b"));
  const c_file = await open(input_file.simple_inject("sub/c"));
  const localA_file = await open(input_file.simple_inject("a"));
  const d_file = await open(input_file.simple_inject("d"));

  // TODO where is localC?? where does it get saved to?

  t.equal(a_file.content, "a");
  t.equal(b_file.content, "b");
  t.equal(c_file.content, "ab");
  t.equal(localA_file.content, "@");
  t.equal(d_file.content, "@b");

  t.true(a_file.stat.mtime < c_file.stat.mtime);
  t.true(b_file.stat.mtime < c_file.stat.mtime);

  t.true(c_file.stat.mtime < d_file.stat.mtime);

  t.true(localA_file.stat.mtime < d_file.stat.mtime);
  t.end();
});
