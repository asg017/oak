import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript";
import json from "rollup-plugin-json";
import builtins from "builtin-modules";

export default {
  input: "./src/oak.ts",
  output: {
    file: "bundle.js",
    format: "iife"
  },
  externals: {
    globals: builtins
  },
  preferBuiltins: true,
  plugins: [
    resolve(),
    commonjs({
      // pass custom options to the resolve plugin
      customResolveOptions: {
        moduleDirectory: "node_modules"
      }
    }),
    typescript(),
    json()
  ]
};
