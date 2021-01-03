import * as std from "std";
import * as os from "os";
import { ShellPipeline, ShellPipelineError, shell as sh } from "./sh.js";

function fail() {
  throw Error("Testing failure.");
}
function assert(actual, expected, message) {
  if (arguments.length == 1) expected = true;

  if (actual === expected) return;

  if (
    actual !== null &&
    expected !== null &&
    typeof actual == "object" &&
    typeof expected == "object" &&
    actual.toString() === expected.toString()
  )
    return;

  throw Error(
    `assertion failed: got |${actual}|, expected |${expected}| ${
      message ? " (" + message + ")" : ""
    }`
  );
}

async function test(tmp) {
  let pipeline;
  await sh`echo -n "hello" | tee ${tmp}`.end();
  assert(std.open(tmp, "r").readAsString(), "hello");

  await sh`bash -c ${`sleep .2 && echo -n hi > ${tmp}`}`.end();
  assert(std.open(tmp, "r").readAsString(), "hi");

  await sh`echo "alex" | rev | tr a-z A-Z | tee ${tmp}`.end();
  assert(std.open(tmp, "r").readAsString(), "XELA\n");

  pipeline = sh`not exist | tee ${tmp}`;

  try {
    await pipeline.end();
    fail();
  } catch (e) {
    assert(
      e instanceof ShellPipelineError,
      true,
      "Error is ShellPipelineError"
    );
    assert(e.i, 0, "First pipe should have throw error.");
    const lastPipe = pipeline.pipes[1];
    const lastPipeWaitResult = os.waitpid(lastPipe.pid);
    assert(lastPipeWaitResult[0], lastPipe.pid);
    assert(
      lastPipeWaitResult[1],
      9,
      "Last pipe should ahve been killed with SIGKILL"
    );
  }
  await sh`mkfile 100m ${tmp}`.end();
  assert(os.stat(tmp)[0].size, 104857600);

  // the wc-l is required here to not overflow the buffer
  await sh`cat ${tmp} | wc -c`.end();
  //await sh`cat ${tmp}`.end(); // will hang, TODO fix
}

async function main() {
  const tmp = "tmp.txt";
  try {
    await test(tmp);
    print("test_sh completed successfully!");
  } finally {
    os.remove(tmp);
  }
}

main().catch((e) => {
  print("ERROR");
  print(e);
  print(e.stack);
  print("Exiting 1.");
  std.exit(1);
});
