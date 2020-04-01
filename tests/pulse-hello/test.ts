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
  t.equals(result.tasks[0].status, "dne");
  t.equals(result.tasks[1].status, "dne");
  t.equals(result.tasks[2].status, "upstream-out");

  await oak_run({ filename: env("Oakfile"), targets: [] });
  result = await getPulse(env("Oakfile"));

  let a = result.tasks.find(task => task.name === "a");
  let b = result.tasks.find(task => task.name === "b");
  let c = result.tasks.find(task => task.name === "c");
  t.true(result.tasks.length === 3);
  t.true(a !== null);
  t.true(b !== null);
  t.true(c !== null);
  t.equals(a.status, "up");
  t.equals(b.status, "up");
  t.equals(c.status, "up");

  const c_file = await open(env.data("c"));

  await touch(env.data("a"), c_file.stat.atime, c_file.stat.mtime);

  result = await getPulse(env("Oakfile"));

  a = result.tasks.find(task => task.name === "a");
  c = result.tasks.find(task => task.name === "c");
  console.log(c.status);
  t.equals(result.tasks.length, 3);
  t.true(a !== null);
  t.true(c !== null);
  // a should be out of date bc oak didnt change the file.
  t.equal(a.status, "out");
  t.equal(c.status, "upstream-out");

  t.end();
});
