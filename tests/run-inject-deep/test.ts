import test from "tape";
import { oak_run } from "../../src/core/run";
import { envFile, getTree } from "../utils";
import { removeSync } from "fs-extra";
import { getBaseFileHashes } from "../../src/utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env("oak_data"));
  removeSync(env(".oak"));
  removeSync(env("sub/.oak"));
  removeSync(env("sub/oak_data"));
  removeSync(env("sub/subsub/.oak"));
  removeSync(env("sub/subsub/oak_data"));
}

const top = env("Oakfile");
const mid = env("sub/Oakfile");
const bot = env("sub/subsub/Oakfile");
const deep = getBaseFileHashes(mid, bot)(["x"]);
const shallow = getBaseFileHashes(top, bot)(["x"]);

const outs = [
  `sub/subsub/oak_data/x`,

  `sub/oak_data/y`,
  `sub/subsub/oak_data/.oak-imports/${deep}/x`,

  `oak_data/y`,
  `sub/subsub/oak_data/.oak-imports/${shallow}/x`
];

test.onFinish(async () => {
  cleanUp();
});

cleanUp();

test("run-inject-deep", async t => {
  await oak_run({
    filename: env("sub/subsub/Oakfile"),
    targets: []
  });
  const t1 = await getTree(outs, env);
  t.equal(t1.get("sub/subsub/oak_data/x").content, "A x");

  await oak_run({
    filename: env("sub/Oakfile"),
    targets: []
  });
  const t2 = await getTree(outs, env);
  t.equal(t2.get("sub/oak_data/y").content, "B x");
  t.equal(t2.get(`sub/subsub/oak_data/.oak-imports/${deep}/x`).content, "B x");

  await oak_run({
    filename: env("Oakfile"),
    targets: []
  });
  const t3 = await getTree(outs, env);

  t.equal(t3.get("oak_data/y").content, "C x");
  t.equal(
    t3.get(`sub/subsub/oak_data/.oak-imports/${shallow}/x`).content,
    "C x"
  );

  t.end();
});
