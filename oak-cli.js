#!/usr/bin/env node
const argv = require("yargs")
  .default("live", false)
  .default("graph", false);
console.log(argv);
