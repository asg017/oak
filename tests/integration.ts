import * as test from "tape";
import { oak_static } from "../src/oak-static";
import * as fs from "fs";

const fileInfo = async (
  path: string
): Promise<{ content: string; stat: fs.Stats }> => {
  const content: string = await new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err: any, data: string) => {
      if (err) reject(err);
      resolve(data);
    });
  });
  const stat: fs.Stats = await new Promise((resolve, reject) => {
    fs.stat(path, (err: any, s: fs.Stats) => {
      if (err) reject(err);
      resolve(s);
    });
  });
  return { content, stat };
};

const file = {
  hello: (path: string) => `${__dirname}/input/hello/${path}`
};

test.onFinish(() => {
  fs.unlinkSync(file.hello("a"));
  fs.unlinkSync(file.hello("b"));
  fs.unlinkSync(file.hello("c"));
});

test("integration", t => {
  t.test("Oakfile.hello", async st => {
    await oak_static({ filename: file.hello("Oakfile"), targets: [] });
    const a_file = await fileInfo(file.hello("a"));
    const b_file = await fileInfo(file.hello("b"));
    const c_file = await fileInfo(file.hello("c"));
    st.equal(a_file.content, "a");
    st.equal(b_file.content, "b");
    st.equal(c_file.content, "ab");
    st.true(a_file.stat.mtime < c_file.stat.mtime);
    st.true(b_file.stat.mtime < c_file.stat.mtime);
    st.end();
  });
});
