import test from "tape";
import { oak_run } from "../../src/oak-run";
import { cleanUp, envFile, open, touch } from "../utils";
import { Set } from "immutable";

const env = envFile(__dirname);

const outs = ["a", "b", "c", "d", "e", "f", "g", "h", "x", "y", "z", "m"];
const outSet = Set(outs);

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

const fileTree = async (): Promise<Map<string, any>> => {
  const files = await Promise.all(
    outs.map(async out => [out, await open(env(out))])
  );
  const map = new Map();
  files.map(file => {
    map.set(file[0], file[1]);
  });
  return map;
};

/*
a  b c   x y  m
|  |/    |/      
d  e     z
|  |
f  g
| /
h
*/
test("run-targets-only", async t => {
  // Tree 1: only target a
  await oak_run({ filename: env("Oakfile"), targets: ["a"] });
  const t1 = await fileTree();

  t.equal(t1.get("a").content, "a");
  // all other recipes should not have been created
  Array.from(outSet.remove("a")).map(recipe => {
    t.equal(t1.get(recipe).stat, null);
  });

  // Tree 2: target d, so a stays same and everything else still empty
  await oak_run({ filename: env("Oakfile"), targets: ["d"] });
  const t2 = await fileTree();

  t.equal(
    t1.get("a").stat.mtime.getTime(),
    t2.get("a").stat.mtime.getTime(),
    "a should not update"
  );
  t.equal(t2.get("d").content, "a");
  t.equal(t2.get("b").stat, null);
  t.true(t2.get("a").stat.mtime < t2.get("d").stat.mtime);

  // Tree 3: target h/x, so adfh built, x built
  await oak_run({ filename: env("Oakfile"), targets: ["h", "x"] });
  const t3 = await fileTree();
  t.equal(t3.get("h").content, "abc");
  t.equal(t3.get("x").content, "x");

  // Tree 4: target z/m, so xy built, m built
  await oak_run({ filename: env("Oakfile"), targets: ["z", "m"] });
  const t4 = await fileTree();
  t.equal(t4.get("z").content, "xy");
  t.equal(t4.get("m").content, "m");
  t.true(t4.get("x").stat.mtime < t4.get("z").stat.mtime);

  // Tree 5: only target h, so adfbceg built
  await oak_run({ filename: env("Oakfile"), targets: ["h"] });
  const t5 = await fileTree();
  t.equal(t4.get("h").stat.mtime.getTime(), t5.get("h").stat.mtime.getTime());

  // Tree 6: touch a, so dfh updates
  await touch(env("a"), t5.get("h").stat.atime, t5.get("h").stat.mtime);
  await oak_run({ filename: env("Oakfile"), targets: ["h"] });
  const t6 = await fileTree();
  t.true(t5.get("a").stat.mtime.getTime() < t6.get("a").stat.mtime.getTime());
  t.true(t5.get("f").stat.mtime.getTime() < t6.get("f").stat.mtime.getTime());
  t.true(t5.get("h").stat.mtime.getTime() < t6.get("h").stat.mtime.getTime());

  t.end();
});
