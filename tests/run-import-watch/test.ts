import test from "tape";
import { removeSync } from "fs-extra";
import { oak_run } from "../../src/core/run";
import { envFile, open, touch } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env("oak_data"));
  removeSync(env(".oak"));
  removeSync(env("sub/oak_data"));
  removeSync(env("sub/.oak"));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

test.skip("run-import-watch", async t => {
  await oak_run({ filename: env("sub/Oakfile"), targets: [] });
  t.equal((await open(env("sub/oak_data/file.txt"))).content, "Alex");

  await oak_run({ filename: env("Oakfile"), targets: [] });
  t.equal((await open(env("hoak_data/file.txt"))).content, "Penguin");

  t.end();
});
