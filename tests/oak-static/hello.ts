import * as test from "tape";
import { oak_static } from "../../src/oak-static";
import { cleanUp, input_file, open, touch } from "../utils";

const outs = ["a", "b", "c"];

test.onFinish(() => {
  cleanUp(input_file.hello, outs);
});

cleanUp(input_file.hello, outs);
test("oak-static hello", async t => {
  await oak_static({ filename: input_file.hello("Oakfile"), targets: [] });
  const a_file = await open(input_file.hello("a"));
  const b_file = await open(input_file.hello("b"));
  const c_file = await open(input_file.hello("c"));
  t.equal(a_file.content, "a");
  t.equal(b_file.content, "b");
  t.equal(c_file.content, "ab");
  t.true(a_file.stat.mtime < c_file.stat.mtime);
  t.true(b_file.stat.mtime < c_file.stat.mtime);

  await touch(input_file.hello("b"), b_file.stat.atime, c_file.stat.mtime);

  await oak_static({ filename: input_file.hello("Oakfile"), targets: [] });
  const new_a_file = await open(input_file.hello("a"));
  const new_b_file = await open(input_file.hello("b"));
  const new_c_file = await open(input_file.hello("c"));

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
