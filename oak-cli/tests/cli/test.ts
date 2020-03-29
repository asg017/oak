import test from "tape";
import { main } from "../../src/index";

test("cli", async t => {
  t.true(typeof main === "function");
  t.end();
});
