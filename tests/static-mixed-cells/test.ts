import * as test from "tape";
import { oak_static } from "../../src/oak-static";
import { cleanUp, envFile, open, getTree } from "../utils";

const env = envFile(__dirname);

const outs = ["a.txt", "b.txt"];

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

test("oak-static hello", async t => {
  await oak_static({ filename: env("Oakfile"), targets: [] });
  const t1 = await getTree(outs, env);

  t.equals(t1.get("a.txt").content, "a");
  t.equals(t1.get("b.txt").content, "a");
  t.end();
});
