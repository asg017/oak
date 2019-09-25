import * as test from "tape";
import { oak_static } from "../../src/oak-static";
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
test("static-import-aliases", async t => {
  await oak_static({
    filename: env("Oakfile"),
    targets: ["x"]
  });
  const x = await open(env("x"));
  const y = await open(env("y"));
  t.equal(x.content, "x");
  t.equal(y.stat, null);

  t.end();
});
