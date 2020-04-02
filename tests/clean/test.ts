import test from "tape";
import { removeSync } from "fs-extra";
import { oak_run } from "../../src/commands/run";
import oak_clean from "../../src/commands/clean";
import { envFile, getTree } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env("oak_data"));
  removeSync(env(".oak"));
}
const outs = ["oak_data/a", "oak_data/b", "oak_data/c"];

test.onFinish(() => {
  cleanUp();
});

cleanUp();

// skipping since this should use oak pulse now.
test.skip("oak-clean", async t => {
  // create all files
  await oak_run({ filename: env("Oakfile"), targets: [] });
  const t1 = await getTree(outs, env);
  t.equal(t1.get("oak_data/a").content, "a");
  t.equal(t1.get("oak_data/b").content, "b");
  t.equal(t1.get("oak_data/c").content, "ab");

  await oak_clean({ filename: env("Oakfile"), targets: [], force: true });
  const t2 = await getTree(outs, env);
  t.equal(t2.get("oak_data/a").stat, null);
  t.equal(t2.get("oak_data/b").stat, null);
  t.equal(t2.get("oak_data/c").stat, null);

  // next: only clean  a, not b and c
  await oak_run({ filename: env("Oakfile"), targets: [] });
  const t3 = await getTree(outs, env);
  t.equal(t3.get("oak_data/a").content, "a");
  t.equal(t3.get("oak_data/b").content, "b");
  t.equal(t3.get("oak_data/c").content, "ab");

  await oak_clean({ filename: env("Oakfile"), targets: ["a"], force: true });
  const t4 = await getTree(outs, env);
  t.equal(t4.get("oak_data/a").stat, null);
  t.equal(t4.get("oak_data/b").content, "b");
  t.equal(t4.get("oak_data/c").content, "ab");

  t.end();
});
