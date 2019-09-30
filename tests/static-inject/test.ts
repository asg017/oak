import * as test from "tape";
import { oak_static } from "../../src/oak-static";
import { cleanUp, envFile, getTree } from "../utils";

const outs = ["sub/a", "sub/b", "sub/c", "d"];
const env = envFile(__dirname);

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

test("oak-static simple-import", async t => {
  await oak_static({
    filename: env("sub/Oakfile"),
    targets: []
  });
  const t1 = await getTree(outs, env);
  t.equal(t1.get("sub/a").content, "NY a");
  t.equal(t1.get("sub/b").content, "NY b");
  t.equal(t1.get("sub/c").content, "NY aNY b");

  await oak_static({
    filename: env("Oakfile"),
    targets: []
  });
  const t2 = await getTree(outs, env);
  t.equal(t2.get("sub/a").content, "NY a");
  t.equal(t2.get("sub/b").content, "NY b");
  t.equal(t2.get("sub/c").content, "NY aNY b");

  t.equal(t2.get("d").content, "CA aCA b");
  t.end();
});
