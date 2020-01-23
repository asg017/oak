import test from "tape";
import { oak_run } from "../../src/commands/run";
import { cleanUp, envFile, getTree } from "../utils";
import { remove } from "fs-extra";
import { getBaseFileHashes } from "../../src/utils";

const env = envFile(__dirname);

const top = env("Oakfile");
const mid = env("sub/Oakfile");
const bot = env("sub/subsub/Oakfile");
const deep = getBaseFileHashes(mid, bot)(["x"]);
const shallow = getBaseFileHashes(top, bot)(["x"]);

const outs = [
  `sub/subsub/x`,

  `sub/y`,
  `sub/subsub/.oak/${deep}/x`,

  `y`,
  `sub/subsub/.oak/${shallow}/x`
];

test.onFinish(async () => {
  cleanUp(env, outs);
  await remove(env("sub/.oak"));
  await remove(env("sub/subsub/.oak"));
});

cleanUp(env, outs);
remove(env("sub/.oak"));
remove(env("sub/subsub/.oak"));

test("run-inject-deep", async t => {
  await oak_run({
    filename: env("sub/subsub/Oakfile"),
    targets: []
  });
  const t1 = await getTree(outs, env);
  t.equal(t1.get("sub/subsub/x").content, "A x");

  await oak_run({
    filename: env("sub/Oakfile"),
    targets: []
  });
  const t2 = await getTree(outs, env);
  t.equal(t2.get("sub/y").content, "B x");
  t.equal(t2.get(`sub/subsub/.oak/${deep}/x`).content, "B x");

  await oak_run({
    filename: env("Oakfile"),
    targets: []
  });
  const t3 = await getTree(outs, env);

  t.equal(t3.get("y").content, "C x");
  t.equal(t3.get(`sub/subsub/.oak/${shallow}/x`).content, "C x");

  t.end();
});
