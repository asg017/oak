import * as test from "tape";
import { oak_static } from "../../src/oak-static";
import { cleanUp, envFile, getTree } from "../utils";
import { remove } from "fs-extra";
import { getInjectHash } from "../../src/utils";

/*

subsub:

wrap
|
x

sub:

wrap    ~wrap~
   \\  / 
     x
   /
 y 


top:
            
wrap    ~wrap~
   \\  / 
     x
   /
 y
 
*/
const env = envFile(__dirname);

async function getHashes(): Promise<{ deep: string; shallow: string }> {
  const top = env("Oakfile");
  const mid = env("sub/Oakfile");
  const bot = env("sub/subsub/Oakfile");
  return {
    deep: await getInjectHash(mid, bot),
    shallow: await getInjectHash(top, bot)
  };
}

getHashes()
  .then(({ deep, shallow }) => {
    const outs = [
      `sub/subsub/x`,

      `sub/y`,
      `sub/subsub/.oak/${deep}/x`,

      `y`,
      `sub/subsub/.oak/${shallow}/x`
    ];

    test.onFinish(async () => {
      cleanUp(env, outs);
      await remove(env("sub/.oak"));
      await remove(env("sub/subsub/.oak"));
    });

    cleanUp(env, outs);
    remove(env("sub/.oak"));
    remove(env("sub/subsub/.oak"));

    test("static-inject-deep", async t => {
      await oak_static({
        filename: env("sub/subsub/Oakfile"),
        targets: []
      });
      const t1 = await getTree(outs, env);
      t.equal(t1.get("sub/subsub/x").content, "A x");

      await oak_static({
        filename: env("sub/Oakfile"),
        targets: []
      });
      const t2 = await getTree(outs, env);
      t.equal(t2.get("sub/y").content, "B x");
      t.equal(t2.get(`sub/subsub/.oak/${deep}/x`).content, "B x");

      await oak_static({
        filename: env("Oakfile"),
        targets: []
      });
      const t3 = await getTree(outs, env);

      t.equal(t3.get("y").content, "C x");
      t.equal(t3.get(`sub/subsub/.oak/${shallow}/x`).content, "C x");

      t.end();
    });
  })
  .catch(e => {
    throw e;
  });
