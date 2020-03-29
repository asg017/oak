import test from "tape";
import { removeSync } from "fs-extra";
import { envFile, open } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env("oak_data"));
  removeSync(env(".oak"));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();

test("lib-command", async t => {
  t.end();
});
