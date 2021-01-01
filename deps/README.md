# deps

I don't want to setup git submodules quiet yet (since this is still an experimental branch), so here are some docs on outside repos that are used as deps for oak.

```
git clone https://github.com/bellard/quickjs.git
git clone https://github.com/observablehq/runtime.git
git clone https://github.com/asg017/unofficial-observablehq-compiler.git
```

## runtime

```bash
cd runtime
yarn

# in runtime.js, add "const setImmediate = cb => setTimeout(cb, 0)" in line 8.
code src/runtime.js

esbuild src/index.js --outfile=runtime-qjs.js --bundle --format=esm

# Add "import {setTimeout} from "os";" to very top
code runtime-qjs.js
```

## compiler

```
cd unofficial-observablehq-compiler
yarn
esbuild src/index.js --outfile=ocompiler-qjs.js --bundle --format=esm
```
