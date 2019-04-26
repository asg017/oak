#!/usr/bin/env node
const argv = require("yargs") // eslint-disable-line
  .default("live", false)
  .default("graph", false);
console.log(argv);
