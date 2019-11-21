## Skeleton for most integration tests

```typescript
import test from "tape";
import { oak_run } from "../../src/oak-run";
import { cleanUp, envFile, open } from "../utils";

const env = envFile(__dirname);

const outs = ["a", "b", "c"];

test.onFinish(() => {
  cleanUp(env, outs);
});

cleanUp(env, outs);

test("TEST_NAME", async t => {
  await oak_run({ filename: env("Oakfile"), targets: [] });
  const a_file = await open(env("a"));
  const b_file = await open(env("b"));
  const c_file = await open(env("c"));
  t.equal(a_file.content, "a");
  t.equal(b_file.content, "b");
  t.equal(c_file.content, "ab");
  t.true(a_file.stat.mtime < c_file.stat.mtime);
  t.true(b_file.stat.mtime < c_file.stat.mtime);
  t.end();
});
```
