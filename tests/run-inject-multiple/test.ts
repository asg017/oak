import test from "tape";
import { oak_run } from "../../src/commands/run";
import { envFile, getTree } from "../utils";
import { getBaseFileHashes } from "../../src/utils";
import { removeSync } from "fs-extra";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env("oak_data"));
  removeSync(env("sub/.oak"));
  removeSync(env("sub/oak_data"));
}

const source = env("Oakfile");
const target = env("sub/Oakfile");
const hash = getBaseFileHashes(source, target);

const outs = [
  "sub/oak_data/x",
  `sub/oak_data/.oak-imports/${hash(["x1"])}/x`,
  `sub/oak_data/.oak-imports/${hash(["x2"])}/x`,
  "oak_data/y1",
  "oak_data/y2"
];

test.onFinish(async () => {
  cleanUp();
});

cleanUp();

test("run-inject-multiple", async t => {
  await oak_run({
    filename: env("sub/Oakfile"),
    targets: []
  });
  const t1 = await getTree(outs, env);
  t.equal(t1.get("sub/oak_data/x").content, "A x");

  await oak_run({
    filename: env("Oakfile"),
    targets: []
  });
  const t2 = await getTree(outs, env);

  t.equal(t2.get("oak_data/y1").content, "B1 x");
  t.equal(t2.get("oak_data/y2").content, "B2 x");

  t.equal(
    t2.get(`sub/oak_data/.oak-imports/${hash(["x1"])}/x`).content,
    "B1 x"
  );
  t.equal(
    t2.get(`sub/oak_data/.oak-imports/${hash(["x2"])}/x`).content,
    "B2 x"
  );
  t.end();
});
