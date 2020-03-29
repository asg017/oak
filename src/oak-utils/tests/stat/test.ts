import { getStat } from "../../src";
import { envFile } from "../utils";
import test from "tape";

const env = envFile(__dirname);

test("getStat", async t => {
  const a = await getStat(env("a.txt"));
  t.true(a.mtime.getTime() > 0);
  const dne = await getStat(env("dne.txt"));
  t.true(dne === null);
  t.end();
});
