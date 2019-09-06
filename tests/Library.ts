import { Library } from "../src/Library";
import * as test from "tape";
import { input_file, open } from "./utils";
import recipe from "../src/Library/recipe";
import shell from "../src/Library/shell";

test("Library.ts", async t => {
  t.test("cell", async st => {
    const c1 = await recipe({
      path: input_file.library("test.txt"),
      make: c => 4
    });
    st.equals(c1.stat.mtime.getTime(), new Date(2).getTime());
    st.end();
  });
  t.test("shell", async st => {
    const b1 = await shell`echo "hello dog"`;
    st.equals(b1, 'echo "hello dog"');
    st.end();
  });
  t.end();
});
