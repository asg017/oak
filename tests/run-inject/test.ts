import test from "tape";
import { oak_run } from "../../src/commands/run";
import { envFile, getTree } from "../utils";
import { removeSync } from "fs-extra";
import { getBaseFileHashes } from "../../src/utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env.data(""));
  removeSync(env("sub/.oak"));
  removeSync(env("sub/oak_data"));
}

const source = env("Oakfile");
const target = env("sub/Oakfile");
const hash = getBaseFileHashes(source, target)(["c"]);
const outs = [
  "sub/oak_data/a",
  "sub/oak_data/b",
  "sub/oak_data/c",
  `sub/oak_data/.oak-imports/${hash}/a`,
  `sub/oak_data/.oak-imports/${hash}/b`,
  `sub/oak_data/.oak-imports/${hash}/c`,
  "oak_data/d"
];

test.onFinish(async () => {
  cleanUp();
});

cleanUp();

test("run-inject", async t => {
  await oak_run({
    filename: env("sub/Oakfile"),
    targets: []
  });
  const t1 = await getTree(outs, env);
  console.log(t1.keys());
  t.equal(t1.get("sub/oak_data/a").content, "NY a");
  t.equal(t1.get("sub/oak_data/b").content, "NY b");
  t.equal(t1.get("sub/oak_data/c").content, "NY aNY b");

  await oak_run({
    filename: env("Oakfile"),
    targets: []
  });
  const t2 = await getTree(outs, env);

  t.equal(t2.get("sub/oak_data/a").content, "NY a");
  t.equal(t2.get("sub/oak_data/b").content, "NY b");
  t.equal(t2.get("sub/oak_data/c").content, "NY aNY b");

  t.equal(t2.get(`sub/oak_data/.oak-imports/${hash}/a`).content, "CA a");
  t.equal(t2.get(`sub/oak_data/.oak-imports/${hash}/b`).content, "CA b");
  t.equal(t2.get(`sub/oak_data/.oak-imports/${hash}/c`).content, "CA aCA b");
  t.equal(t2.get("oak_data/d").content, "CA aCA b");
  t.end();
});
