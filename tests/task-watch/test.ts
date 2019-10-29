import * as test from "tape";
import { oak_run } from "../../src/oak-run";
import { cleanUp, envFile, open } from "../utils";
import { writeFileSync } from "fs";

const env = envFile(__dirname);

const outs = ["a", "b", "c", "build_c.js"];

const createBuildC = (contents: string) => {
  console.log("QQQQQQQQQQ", env("build_c.js"));
  writeFileSync(env("build_c.js"), contents, "utf8");
};

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

test("task-watch", async t => {
  createBuildC(`
const { readFileSync } = require("fs");
const ins = process.argv.slice(2);
ins.map(inp => process.stdout.write(readFileSync(inp)));
process.stdout.write("C1");
`);

  await oak_run({ filename: env("Oakfile"), targets: [] });
  const a_file = await open(env("a"));
  const b_file = await open(env("b"));
  const c_file = await open(env("c"));
  t.equal(a_file.content, "a");
  t.equal(b_file.content, "b");
  t.equal(c_file.content, "abC1");
  t.true(a_file.stat.mtime < c_file.stat.mtime);
  t.true(b_file.stat.mtime < c_file.stat.mtime);

  createBuildC(`
const { readFileSync } = require("fs");
const ins = process.argv.slice(2);
ins.map(inp => process.stdout.write(readFileSync(inp)));
process.stdout.write("C2");
`);

  await oak_run({ filename: env("Oakfile"), targets: [] });
  const a_file2 = await open(env("a"));
  const b_file2 = await open(env("b"));
  const c_file2 = await open(env("c"));
  t.equal(a_file2.content, "a");
  t.equal(b_file2.content, "b");
  t.equal(c_file2.content, "abC2");
  t.true(a_file2.stat.mtime < c_file2.stat.mtime);
  t.true(b_file2.stat.mtime < c_file2.stat.mtime);

  t.equal(a_file.stat.mtime.getTime(), a_file2.stat.mtime.getTime());
  t.equal(b_file.stat.mtime.getTime(), b_file2.stat.mtime.getTime());
  t.true(c_file.stat.mtime < c_file2.stat.mtime);

  t.end();
});
