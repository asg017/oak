import test from "tape";
import { removeSync } from "fs-extra";
import { oak_run } from "../../src/core/run";
import { envFile, open } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env("oak_data"));
  removeSync(env(".oak"));
  removeSync(env("sub/oak_data"));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

/*

a
|
b ----- b   x
        |  /
        y

*/
test("run-targets-import", async t => {
  await oak_run({ filename: env("Oakfile"), targets: ["x"] });
  let a = await open(env("sub/oak_data/a"));
  let b = await open(env("sub/oak_data/b"));
  let x = await open(env("oak_data/x"));
  let y = await open(env("oak_data/y"));

  t.equal(a.content, null);
  t.equal(b.content, null);
  t.equal(x.content, "x");
  t.equal(y.content, null);

  await oak_run({ filename: env("Oakfile"), targets: [] });
  a = await open(env("sub/oak_data/a"));
  b = await open(env("sub/oak_data/b"));
  x = await open(env("oak_data/x"));
  y = await open(env("oak_data/y"));

  t.equal(a.content, "a");
  t.equal(b.content, "a");
  t.equal(x.content, "x");
  t.equal(y.content, "xa");

  t.end();
});
