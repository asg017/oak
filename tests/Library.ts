import Library, { FileInfo } from "../src/Library";
import * as test from "tape";

const { bash, cell } = Library;

test("Library.ts", async t => {
  const c = await cell()({ path: "", recipe: c => 4 });
  t.end();
});
