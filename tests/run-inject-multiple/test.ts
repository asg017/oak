import test from "tape";
import { oak_run } from "../../src/commands/run";
import { cleanUp, envFile, getTree } from "../utils";
import { getBaseFileHashes } from "../../src/utils";
import { remove } from "fs-extra";

const env = envFile(__dirname);

const source = env("Oakfile");
const target = env("sub/Oakfile");
const hash = getBaseFileHashes(source, target);

const outs = [
  "sub/x",
  `sub/.oak/${hash(["x1"])}/x`,
  `sub/.oak/${hash(["x2"])}/x`,
  "y1",
  "y2"
];

test.onFinish(async () => {
  cleanUp(env, outs);
  await remove(env("sub/.oak"));
});

cleanUp(env, outs);
remove(env("sub/.oak"));

test("run-inject", async t => {
  await oak_run({
    filename: env("sub/Oakfile"),
    targets: []
  });
  const t1 = await getTree(outs, env);
  t.equal(t1.get("sub/x").content, "A x");

  await oak_run({
    filename: env("Oakfile"),
    targets: []
  });
  const t2 = await getTree(outs, env);

  t.equal(t2.get("y1").content, "B1 x");
  t.equal(t2.get("y2").content, "B2 x");

  t.equal(t2.get(`sub/.oak/${hash(["x1"])}/x`).content, "B1 x");
  t.equal(t2.get(`sub/.oak/${hash(["x2"])}/x`).content, "B2 x");
  t.end();
});
