import test from "tape";
import { oak_run } from "../../src/commands/run";
import { cleanUp, envFile, getTree } from "../utils";
import { remove } from "fs-extra";
import { getBaseFileHashes } from "../../src/utils";

const env = envFile(__dirname);

const source = env("Oakfile");
const target = env("sub/Oakfile");
const hash = getBaseFileHashes(source, target)(["c"]);
const outs = [
  "sub/a",
  "sub/b",
  "sub/c",
  `sub/.oak/${hash}/a`,
  `sub/.oak/${hash}/b`,
  `sub/.oak/${hash}/c`,
  "d"
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
  t.equal(t1.get("sub/a").content, "NY a");
  t.equal(t1.get("sub/b").content, "NY b");
  t.equal(t1.get("sub/c").content, "NY aNY b");

  await oak_run({
    filename: env("Oakfile"),
    targets: []
  });
  const t2 = await getTree(outs, env);

  t.equal(t2.get("sub/a").content, "NY a");
  t.equal(t2.get("sub/b").content, "NY b");
  t.equal(t2.get("sub/c").content, "NY aNY b");

  t.equal(t2.get(`sub/.oak/${hash}/a`).content, "CA a");
  t.equal(t2.get(`sub/.oak/${hash}/b`).content, "CA b");
  t.equal(t2.get(`sub/.oak/${hash}/c`).content, "CA aCA b");
  t.equal(t2.get("d").content, "CA aCA b");
  t.end();
});
