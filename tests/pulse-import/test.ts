import test from "tape";
import { removeSync } from "fs-extra";
import { oak_run } from "../../src/commands/run";
import { getPulse, PulseTask } from "../../src/commands/pulse";
import { envFile, open } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env.data(""));
  removeSync(env(".oak"));
  removeSync(env("sub/oak_data"));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

function getPulseTree(result: { tasks: PulseTask[] }) {
  const map = new Map();
  for (const task of result.tasks) map.set(task.pulse.name, task);
  return map;
}
/*

a
|
b  --- myB  x
       |   /
       y

*/
test.skip("pulse-import", async t => {
  let result = await getPulse(env("Oakfile"));
  const ptree = getPulseTree(result);
  console.log(ptree);
  t.true(result.tasks.length === 3);
  t.equals(ptree.get("x").pulse.status, "dne");
  t.equals(ptree.get("y").pulse.status, "out-upstream");
  t.equals(ptree.get("myB").pulse.status, "out-upstream");
  /*
  await oak_run({
    filename: env("Oakfile"),
    targets: ["x"]
  });
  const x = await open(env.data("x"));
  let y = await open(env.data("y"));
  t.equal(x.content, "x");
  t.equal(y.stat, null);

  await oak_run({
    filename: env("Oakfile"),
    targets: ["y"]
  });
  const b = await open(env("sub/oak_data/b"));
  y = await open(env.data("y"));
  t.equal(b.content, "a");
  t.equal(y.content, "xa");
*/
  t.end();
});
