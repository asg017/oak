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
  hello: (path: string) => `${__dirname}/input/hello/${path}`,
  simple_import: (path: string) => `${__dirname}/input/simple-import/${path}`
};
const outputs = {
  hello: ["a", "b", "c"].map(file.hello),
  simple_import: ["sub/a", "sub/b", "sub/c", "d", "f"].map(file.simple_import)
};

function cleanUp() {
  Object.keys(outputs).map(name => {
    console.log(`Deleting for ${name}...`);
    outputs[name].map(f => {
      console.log(`\t${f}`);
      try {
        fs.unlinkSync(f);
      } catch {} // o no
    });
  });
}
test.onFinish(() => {
  cleanUp();
});
cleanUp();
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
  t.test("Oakfile.simple-import", async st => {
    await oak_static({ filename: file.simple_import("Oakfile"), targets: [] });
    const a_file = await fileInfo(file.simple_import("sub/a"));
    const b_file = await fileInfo(file.simple_import("sub/b"));
    const c_file = await fileInfo(file.simple_import("sub/c"));
    const d_file = await fileInfo(file.simple_import("d"));
    const f_file = await fileInfo(file.simple_import("f"));
    st.equal(a_file.content, "a");
    st.equal(b_file.content, "b");
    st.equal(c_file.content, "ab");
    st.equal(d_file.content, "ab");
    st.equal(f_file.content, "fff");
    st.true(a_file.stat.mtime < c_file.stat.mtime);
    st.true(b_file.stat.mtime < c_file.stat.mtime);
    st.true(c_file.stat.mtime < d_file.stat.mtime);
    st.end();
  });
  t.end();
});
