import * as test from "tape";
import { oak_run } from "../../src/oak-run";
import { envFile, cleanUp, getTree } from "../utils";

const env = envFile(__dirname);
const outs = ["greetings"];

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

process.on("unhandledRejection", e => {
  console.log("Unhandled Rejection at:", e);
});

test("run-overrides", async t => {
  await oak_run({
    filename: env("Oakfile"),
    targets: [],
    overrides: ['name="Alex"']
  });
  const t1 = await getTree(outs, env);

  t.equal(t1.get("greetings").content, "Hello Alex");
  t.end();
});
