import { Library } from "../../src/Library";
import test from "tape";
import { envFile, open } from "../utils";
import task from "../../src/Library/task";
import shell from "../../src/Library/shell";
import { Execution } from "../../src/Execution";

const env = envFile(__dirname);

test("Library.ts", async t => {
  t.test("cell", async st => {
    const c1 = await task({
      target: env("test.txt"),
      run: c => 4
    });
    st.skip(); // .equals(c1.stat.mtime.getTime(), new Date(2).getTime());
    st.end();
  });
  t.test("shell", async st => {
    const b1 = await shell`echo "hello dog"`;
    st.skip(); //typeof b1, "excution");
    st.end();
  });
  t.end();
});
