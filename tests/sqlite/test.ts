import test from "tape";
import { removeSync } from "fs-extra";
import { oak_run } from "../../src/commands/run";
import { envFile, open, touch } from "../utils";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env.data(""));
  removeSync(env(".oak"));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();
/*

text = "originalText"

a = task({
    target: "a",
    run: a => shell`Running a...; \
    echo -n "${text}" > ${a}`
})

b = task({
    target: "b",
    run: b => shell`Running b...; \
    echo -n "b" > ${a}`
})

c = task({
    target: "x",
    run: c => shell`Running x...; \
    cat ${a} ${b} > ${c}`
})
===================================================
a.content === "originalText"
b.content === "b"
orig_c.content === "originalTextb"
a.stat.mtime < orig_c.state.mtime
b.stat.mtime < orig_c.state.mtime
===================================================
text = "originalText"

a = task({
    target: "a",
    run: a => shell`Running a...; \
    echo -n "${text}" > ${a}`
})

b = task({
    target: "b",
    run: b => shell`Running b...; \
    echo -n "newB" > ${a}`
})

c = task({
    target: "x",
    run: c => shell`Running x...; \
    cat ${a} ${b} > ${c}`
})
===================================================
a.content === "originalText"
b.content === "newB"
c.content === "originalTextnewB"
orig_a.stat.mtime === a .stat.mtime
orig_c.stat.mtime < c.state.mtime
orig_b.stat.mtime < b.state.mtime
===================================================
text = "newText"

a = task({
    target: "a",
    run: a => shell`Running a...; \
    echo -n "${text}" > ${a}`
})

b = task({
    target: "b",
    run: b => shell`Running b...; \
    echo -n "newB" > ${a}`
})

c = task({
    target: "x",
    run: c => shell`Running x...; \
    cat ${a} ${b} > ${c}`
})
===================================================
a.content === "newText"
b.content === "newB"
c.content === "newTextnewB"
a2.stat.mtime <= a3.stat.mtime
b2.stat.mtime === b3.stat.mtime
c2.stat.mtime < c3.stat.mtime
===================================================
*/

test("sqlite", async t => {
  /*await oak_run({ filename: env("Oakfile"), targets: [] });
  const a_file = await open(env.data("a"));
  const b_file = await open(env.data("b"));
  const c_file = await open(env.data("c"));
  t.equal(a_file.content, "a");
  t.equal(b_file.content, "b");
  t.equal(c_file.content, "ab");
  t.true(a_file.stat.mtime < c_file.stat.mtime);
  t.true(b_file.stat.mtime < c_file.stat.mtime);
*/
  t.end();
});
