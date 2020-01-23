import test from "tape";
import { oak_run } from "../../src/commands/run";
import { cleanUp, envFile, open } from "../utils";

const outs = ["sub/a", "sub/b", "x", "y"];
const env = envFile(__dirname);

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

/*

a
|
b  --- myB  x
       |   /
       y

*/
test("run-import-aliases", async t => {
  await oak_run({
    filename: env("Oakfile"),
    targets: ["x"]
  });
  const x = await open(env("x"));
  let y = await open(env("y"));
  t.equal(x.content, "x");
  t.equal(y.stat, null);

  await oak_run({
    filename: env("Oakfile"),
    targets: ["y"]
  });
  const b = await open(env("sub/b"));
  y = await open(env("y"));
  t.equal(b.content, "a");
  t.equal(y.content, "xa");

  t.end();
});
