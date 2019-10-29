import * as test from "tape";
import { oak_run } from "../../src/oak-run";
import oak_clean from "../../src/oak-clean";
import { cleanUp, envFile, open, getTree } from "../utils";

const env = envFile(__dirname);

const outs = ["a", "b", "c"];

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

test("oak-clean", async t => {
  // create all files
  await oak_run({ filename: env("Oakfile"), targets: [] });
  const t1 = await getTree(outs, env);
  t.equal(t1.get("a").content, "a");
  t.equal(t1.get("b").content, "b");
  t.equal(t1.get("c").content, "ab");

  await oak_clean({ filename: env("Oakfile"), targets: [], force: true });
  const t2 = await getTree(outs, env);
  t.equal(t2.get("a").stat, null);
  t.equal(t2.get("b").stat, null);
  t.equal(t2.get("c").stat, null);

  // next: only clean  a, not b and c
  await oak_run({ filename: env("Oakfile"), targets: [] });
  const t3 = await getTree(outs, env);
  t.equal(t3.get("a").content, "a");
  t.equal(t3.get("b").content, "b");
  t.equal(t3.get("c").content, "ab");

  await oak_clean({ filename: env("Oakfile"), targets: ["a"], force: true });
  const t4 = await getTree(outs, env);
  t.equal(t4.get("a").stat, null);
  t.equal(t4.get("b").content, "b");
  t.equal(t4.get("c").content, "ab");

  t.end();
});
