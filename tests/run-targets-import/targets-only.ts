import test from "tape";
import { oak_run } from "../../src/oak-run";
import { cleanUp, envFile, open, touch } from "../utils";
import { Set } from "immutable";

const env = envFile(__dirname);

const outs = ["sub/a", "sub/b", "x", "y"];

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

/*

a
|
b ----- b   x
        |  /
        y

*/
test("static-targets-only", async t => {
  await oak_run({ filename: env("Oakfile"), targets: ["x"] });
  let a = await open(env("sub/a"));
  let b = await open(env("sub/b"));
  let x = await open(env("x"));
  let y = await open(env("y"));

  t.equal(a.content, null);
  t.equal(b.content, null);
  t.equal(x.content, "x");
  t.equal(y.content, null);

  await oak_run({ filename: env("Oakfile"), targets: [] });
  a = await open(env("sub/a"));
  b = await open(env("sub/b"));
  x = await open(env("x"));
  y = await open(env("y"));

  t.equal(a.content, "a");
  t.equal(b.content, "a");
  t.equal(x.content, "x");
  t.equal(y.content, "xa");

  t.end();
});
