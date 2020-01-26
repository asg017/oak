import test from "tape";
import { removeSync, writeFileSync } from "fs-extra";
import { oak_run } from "../../src/commands/run";
import { envFile, open } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env('oak_data'));
  removeSync(env('build_c.js'));

}

const createBuildC = (contents: string) => {
  writeFileSync(env("build_c.js"), contents, "utf8");
};

test.onFinish(() => {
  cleanUp();
});

cleanUp();

test("task-watch", async t => {
  createBuildC(`
const { readFileSync } = require("fs");
const ins = process.argv.slice(2);
ins.map(inp => process.stdout.write(readFileSync(inp)));
process.stdout.write("C1");
`);

  await oak_run({ filename: env("Oakfile"), targets: [] });
  const a_file = await open(env("oak_data/a"));
  const b_file = await open(env("oak_data/b"));
  const c_file = await open(env("oak_data/c"));
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
  const a_file2 = await open(env("oak_data/a"));
  const b_file2 = await open(env("oak_data/b"));
  const c_file2 = await open(env("oak_data/c"));
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
