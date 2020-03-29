import test from "tape";
import { removeSync } from "fs-extra";
import { oak_run } from "../../src/commands/run";
import { getPulse } from "../../src/commands/pulse";
import { envFile, open, touch } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env.data(""));
  removeSync(env(".oak"));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

test("oak-pulse hello", async t => {
  let result = await getPulse(env("Oakfile"));

  t.true(result.tasks.length === 3);
  t.true(result.tasks[0].status === "dne");
  t.true(result.tasks[1].status === "dne");
  t.true(result.tasks[2].status === "dne");

  await oak_run({ filename: env("Oakfile"), targets: [] });
  result = await getPulse(env("Oakfile"));

  let a = result.tasks.find(task => task.name === "a");
  let b = result.tasks.find(task => task.name === "b");
  let c = result.tasks.find(task => task.name === "c");
  t.true(result.tasks.length === 3);
  t.true(a !== null);
  t.true(a.status === "up");
  t.true(b !== null);
  t.true(b.status === "up");
  t.true(c !== null);
  t.true(c.status === "up");

  const c_file = await open(env.data("c"));

  await touch(env.data("a"), c_file.stat.atime, c_file.stat.mtime);

  result = await getPulse(env("Oakfile"));

  a = result.tasks.find(task => task.name === "a");
  c = result.tasks.find(task => task.name === "c");
  t.true(result.tasks.length === 3);
  t.true(a !== null);
  t.true(a.status === "up");
  t.true(c !== null);
  t.true(c.status === "out");

  t.end();
});
