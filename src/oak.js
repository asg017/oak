import { Runtime } from "../deps/runtime/runtime-qjs.js";
import { Compiler } from "../deps/unofficial-observablehq-compiler/ocompiler-qjs.js";

import * as os from "os";
import * as std from "std";

import { shell as sh } from "./sh.js";
import { createTaskDefintion } from "./Task.js";

// TODO safer c implementation
function dirname(filepath) {
  return filepath.substring(0, filepath.lastIndexOf("/"));
}

function graph(module) {
  const ignore = new Set(module._runtime._builtin._scope.keys());
  return Array.from(module._runtime._variables)
    .filter(
      (v) =>
        !(
          (v._inputs.length === 1 && v._module !== v._inputs[0]._module) // isimport
        ) && v._reachable
    )
    .filter((v) => v._module !== module._runtime._builtin) // is builtin
    .filter((v) => !ignore.has(v._name))
    .map((v) => ({
      name: v._name,
      inputs: v._inputs.map((d) => d._name).filter((d) => !ignore.has(d)),
    }));
}

async function run(...args) {
  let ojsFilePath, err;
  print(args);
  const [ojsFileRelativePath, ...extraArgs] = args;

  if (!ojsFileRelativePath) {
    throw Error(
      `run usage: run [filename]. Missing filepath, pased ${ojsFilePath}`
    );
  }

  [ojsFilePath, err] = os.realpath(ojsFileRelativePath);

  if (err)
    throw Error(`Run: error ${err} at os.realpath for ${ojsFileRelativePath}`);

  const ojsFile = std.open(ojsFilePath, "r");

  const compile = new Compiler(print);
  const outDir = `${dirname(ojsFilePath)}/oak_data`;
  os.mkdir(outDir);
  const stdlib = {
    Task: () => createTaskDefintion(outDir),
    sh: () => sh,
    env: () => (key) => std.getenv(key),
  };

  const runtime = new Runtime(stdlib, null);
  const define = await compile.module(ojsFile.readAsString());

  const m = runtime.module(define, (name) => {
    return {
      //pending: () => console.log("pending", name),
      fulfilled: (value) => console.log("fulfilled", name, value),
      rejected: (error) => console.log("rejected", name, error),
    };
  });
  print(`digraph {
    ${graph(m)
      .map((p) => `{${p.inputs.join(",")}} -> ${p.name};`)
      .join("\n")}
  }`);
  await runtime._compute();
  /*os.signal(os.SIGINT, (e) => {
    print("sigint");
    runtime.dispose();
  });*/
  await Promise.all(Array.from(m._scope.keys()).map((c) => m.value(c)));
  runtime.dispose();
  print("done");
  //await new Promise((res, rej) => setTimeout(res, 1000));
}

async function main() {
  const [scriptName, cmd, ...args] = scriptArgs;
  if (!cmd) {
    throw Error(`Usage: ${scriptName} [cmd] ...args`);
  }
  if (cmd === "run") await run(...args);
  else {
    throw Error(`Unrecognized command "${cmd}"`);
  }
}

main().catch((e) => {
  print("ERROR:");
  print(e);
  print(e.stack);
  exit(1);
});
