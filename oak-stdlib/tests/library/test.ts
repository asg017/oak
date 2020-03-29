import { Library } from "../../src";
import test from "tape";
import { envFile } from "../utils";
import task from "../../src/Library/task";
import shell from "../../src/Library/shell";

const env = envFile(__dirname);

test("Library.ts", async t => {
  const l = new Library();
  t.true(l.shell);
  t.test("task", async st => {
    const c1 = await task({
      target: env("test.txt"),
      run: c => 4
    });
    st.skip(); // .equals(c1.stat.mtime.getTime(), new Date(2).getTime());
    st.end();
  });
  t.test("shell", async st => {
    const s = shell`echo -n "hello dog"`;
    let res = "";

    s.process.stdout.on("data", d => (res += d.toString()));

    await new Promise((resolve, reject) => {
      s.process.on("exit", (code, signal) => {
        if (code === 0) return resolve();
        reject(code);
      });
    }).catch(e => st.fail(e));
    st.equals(res, "hello dog");
    st.end();
  });
  t.end();
});
