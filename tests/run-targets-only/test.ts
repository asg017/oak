import test from "tape";
import { removeSync } from "fs-extra";
import { oak_run } from "../../src/commands/run";
import { envFile, touch, getTree } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env("oak_data"));
  removeSync(env(".oak"));
}

const outs: string[] = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "x",
  "y",
  "z",
  "m"
].map(s => `oak_data/${s}`);

test.onFinish(() => {
  cleanUp();
});

cleanUp();

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
  const t1 = await getTree(outs, env);

  t.equal(t1.get("oak_data/a").content, "a");
  // all other recipes should not have been created
  outs.map(out => {
    if (out != "oak_data/a") t.equal(t1.get(out).stat, null);
  });

  // Tree 2: target d, so a stays same and everything else still empty
  await oak_run({ filename: env("Oakfile"), targets: ["d"] });
  const t2 = await getTree(outs, env);

  t.equal(
    t1.get("oak_data/a").stat.mtime.getTime(),
    t2.get("oak_data/a").stat.mtime.getTime(),
    "a should not update"
  );
  t.equal(t2.get("oak_data/d").content, "a");
  t.equal(t2.get("oak_data/b").stat, null);
  t.true(t2.get("oak_data/a").stat.mtime < t2.get("oak_data/d").stat.mtime);

  // Tree 3: target h/x, so adfh built, x built
  await oak_run({ filename: env("Oakfile"), targets: ["h", "x"] });
  const t3 = await getTree(outs, env);
  t.equal(t3.get("oak_data/h").content, "abc");
  t.equal(t3.get("oak_data/x").content, "x");

  // Tree 4: target z/m, so xy built, m built
  await oak_run({ filename: env("Oakfile"), targets: ["z", "m"] });
  const t4 = await getTree(outs, env);
  t.equal(t4.get("oak_data/z").content, "xy");
  t.equal(t4.get("oak_data/m").content, "m");
  t.true(t4.get("oak_data/x").stat.mtime < t4.get("oak_data/z").stat.mtime);

  // Tree 5: only target h, so adfbceg built
  await oak_run({ filename: env("Oakfile"), targets: ["h"] });
  const t5 = await getTree(outs, env);
  t.equal(
    t4.get("oak_data/h").stat.mtime.getTime(),
    t5.get("oak_data/h").stat.mtime.getTime()
  );

  // Tree 6: touch a, so dfh updates
  await touch(
    env("oak_data/a"),
    t5.get("oak_data/h").stat.atime,
    t5.get("oak_data/h").stat.mtime
  );
  await oak_run({ filename: env("Oakfile"), targets: ["h"] });
  const t6 = await getTree(outs, env);
  t.true(
    t5.get("oak_data/a").stat.mtime.getTime() <
      t6.get("oak_data/a").stat.mtime.getTime()
  );
  t.true(
    t5.get("oak_data/f").stat.mtime.getTime() <
      t6.get("oak_data/f").stat.mtime.getTime()
  );
  t.true(
    t5.get("oak_data/h").stat.mtime.getTime() <
      t6.get("oak_data/h").stat.mtime.getTime()
  );

  t.end();
});
