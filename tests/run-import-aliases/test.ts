import test from "tape";
import {removeSync} from 'fs-extra';
import { oak_run } from "../../src/commands/run";
import { envFile, open } from "../utils";

const env = envFile(__dirname);

function cleanUp(){
  removeSync(env.data(''));
  removeSync(env('sub/oak_data'));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

/*

a
|
b  --- myB  x
       |   /
       y

*/
test("run-import-aliases", async t => {
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

  t.end();
});
