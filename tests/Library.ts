import { Library } from "../src/Library";
import * as test from "tape";
import { input_file, open } from "./utils";
import cell from "../src/Library/cell";
import bash from "../src/Library/bash";

// const { bash, cell } = new Library();

test("Library.ts", async t => {
  t.test("cell", async st => {
    const c1 = await cell({
      path: input_file.library("test.txt"),
      recipe: c => 4
    });
    st.equals(c1.stat.mtime.getTime(), new Date(2).getTime());
    st.end();
  });
  t.test("bash", async st => {
    const b1 = await bash`echo "hello dog"`;
    st.equals(b1, 'echo "hello dog"');
    st.end();
  });
  t.end();
});
