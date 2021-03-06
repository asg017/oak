import test from "tape";
import { removeSync, writeFileSync } from "fs-extra";
import { envFile, open } from "../utils";
import { oak_run } from "../../src/core/run";

const env = envFile(__dirname);

function cleanUp() {
  removeSync(env.data(""));
  removeSync(env(".oak"));
  removeSync(env("Oakfile"));
}

test.onFinish(() => {
  cleanUp();
});

cleanUp();
function writeOakfile(contents: string) {
  writeFileSync(env("Oakfile"), contents, "utf8");
}

test("sqlite", async t => {
  // Test #1: Regular Oakfile.
  writeOakfile(`
    text = "originalText"

a = new Task({
    target: "a",
    run: a => shell\`echo "Running a..."; \
    echo -n "\${text}" > \${a}\`
})

b = new Task({
    target: "b",
    run: b => shell\`echo "Running b..."; \
    echo -n "b" > \${b}\`
})

c = new Task({
    target: "c",
    run: c => shell\`echo "Running c..."; \
    cat \${a} \${b} > \${c}\`
})
    `);

  await oak_run({ filename: env("Oakfile"), targets: [] });

  const [a1, b1, c1] = await Promise.all([
    open(env.data("a")),
    open(env.data("b")),
    open(env.data("c"))
  ]);

  t.true(a1.content === "originalText");
  t.true(b1.content === "b");
  t.true(c1.content === "originalTextb");
  t.true(a1.stat.mtime < c1.stat.mtime);
  t.true(b1.stat.mtime < c1.stat.mtime);

  // Test 2: Change the contents of b ("b" => "newB").
  // b must change, c must change, a stays the same.

  writeOakfile(`
text = "originalText"

a = new Task({
    target: "a",
    run: a => shell\`echo "Running a..."; \
    echo -n "\${text}" > \${a}\`
})

b = new Task({
    target: "b",
    run: b => shell\`echo "Running b..."; \
    echo -n "newB" > \${b}\`
})

c = new Task({
    target: "c",
    run: c => shell\`echo "Running c..."; \
    cat \${a} \${b} > \${c}\`
})
`);

  await oak_run({ filename: env("Oakfile"), targets: [] });

  const [a2, b2, c2] = await Promise.all([
    open(env.data("a")),
    open(env.data("b")),
    open(env.data("c"))
  ]);

  t.true(a2.content === "originalText");
  t.true(b2.content === "newB");
  t.true(c2.content === "originalTextnewB");
  t.true(a2.stat.mtime.getTime() === a1.stat.mtime.getTime());
  t.true(b2.stat.mtime > b1.stat.mtime);
  t.true(b2.stat.mtime < c2.stat.mtime);
  t.true(c2.stat.mtime > c1.stat.mtime);
  t.true(c2.stat.mtime > a1.stat.mtime);

  // Test #3: text changes, so a changes, not b, and c changes.

  writeOakfile(`
text = "newText"

a = new Task({
    target: "a",
    run: a => shell\`echo "Running a..."; \
    echo -n "\${text}" > \${a}\`
})

b = new Task({
    target: "b",
    run: b => shell\`echo "Running b..."; \
    echo -n "newB" > \${b}\`
})

c = new Task({
    target: "c",
    run: c => shell\`echo "Running c..."; \
    cat \${a} \${b} > \${c}\`
})
`);

  await oak_run({ filename: env("Oakfile"), targets: [] });

  const [a3, b3, c3] = await Promise.all([
    open(env.data("a")),
    open(env.data("b")),
    open(env.data("c"))
  ]);

  t.true(a3.content === "newText");
  t.true(b3.content === "newB");
  t.true(c3.content === "newTextnewB");
  t.true(a3.stat.mtime > a2.stat.mtime);
  t.true(b3.stat.mtime.getTime() === b2.stat.mtime.getTime());
  t.true(b3.stat.mtime < a3.stat.mtime);
  t.true(c3.stat.mtime > c2.stat.mtime);
  t.true(c3.stat.mtime > a3.stat.mtime);
  t.end();
});
