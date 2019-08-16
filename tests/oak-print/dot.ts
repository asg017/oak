import * as test from "tape";
import { oak_print } from "../../src/oak-print";
import { input_file } from "../utils";

test("oak-print dot", async t => {
  const result = await oak_print({ filename: "", output: "dot" });
  t.end();
});
