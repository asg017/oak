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
  console.log(result);
  t.true(result.tasks.length === 3);
  t.equals(result.tasks[0].pulse.status, "dne");
  t.equals(result.tasks[1].pulse.status, "dne");
  t.equals(result.tasks[2].pulse.status, "out-upstream");

  await oak_run({ filename: env("Oakfile"), targets: [] });
  result = await getPulse(env("Oakfile"));

  let a = result.tasks.find(task => task.pulse.name === "a");
  let b = result.tasks.find(task => task.pulse.name === "b");
  let c = result.tasks.find(task => task.pulse.name === "c");
  console.log(result);
  t.true(result.tasks.length === 3);
  t.true(a);
  t.true(b);
  t.true(c);
  t.equals(a.pulse.status, "up");
  t.equals(b.pulse.status, "up");
  t.equals(c.pulse.status, "up");

  const c_file = await open(env.data("c"));

  await touch(env.data("a"), c_file.stat.atime, c_file.stat.mtime);

  result = await getPulse(env("Oakfile"));

  a = result.tasks.find(task => task.pulse.name === "a");
  c = result.tasks.find(task => task.pulse.name === "c");
  t.equals(result.tasks.length, 3);
  t.true(a !== null);
  t.true(c !== null);
  // a should be out of date bc oak didnt change the file.
  t.equal(a.pulse.status, "out-dep");
  t.equal(c.pulse.status, "out-upstream");

  t.end();
});
