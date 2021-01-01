import * as std from "std";
import * as os from "os";
import { ShellPipeline, shell as sh } from "./sh.js";

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

async function main() {
  const tmp = "tmp.txt";
  await sh`echo -n "hello" | tee ${tmp}`.end();
  assert(std.open(tmp, "r").readAsString(), "hello");

  await sh`bash -c ${`sleep .2 && echo -n hi > ${tmp}`}`.end();
  assert(std.open(tmp, "r").readAsString(), "hi");

  await sh`echo "alex" | rev | tr a-z A-Z | tee ${tmp}`.end();
  assert(std.open(tmp, "r").readAsString(), "XELA\n");

  os.remove(tmp);
}

main().catch((e) => {
  print("ERROR");
  print(e);
  print(e.stack);
  exit(1);
});
