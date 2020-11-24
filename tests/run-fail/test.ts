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
  console.log('finished');
});

cleanUp();

test("run fail", async t => {
  
  // a should work as expected.
  // b creates file, but exits nonzero.
  // c doesnt create a file, but exits 0.
  await oak_run({ filename: env("Oakfile"), targets: [] });
  const a_file = await open(env.data("a"));
  const b_file = await open(env.data("b"));
  const c_file = await open(env.data("c"));

  t.equal(a_file.content, "a");
  t.equal(b_file.content, "b");
  t.equal(c_file.content, null);
  t.equal(c_file.stat, null);

  t.end();
});
