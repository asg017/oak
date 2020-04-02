import { Library } from "../../src/Library";
import test from "tape";
import { envFile, open } from "../utils";
import shell from "../../src/Library/shell";
import { Execution } from "../../src/Execution";

const env = envFile(__dirname);

test("Library.ts", async t => {
  t.test("shell", async st => {
    const b1 = await shell`echo "hello dog"`;
    st.skip(); //typeof b1, "excution");
    st.end();
  });
  t.end();
});
