#!/usr/bin/env node
const argv = require("yargs") // eslint-disable-line
  .command(["static [targets...]", "$0"], "Run oak statically", yargs =>
    yargs
      .options("f", {
        alias: "file",
        description: "Oakfile path",
        type: "string",
        default: "Oakfile"
      })
      .positional("targets", {
        description: "several targets"
      })
  )
  .command("live", "Run oak live", yargs =>
    yargs
      .options("file", {
        alias: "f",
        description: "Oakfile path",
        type: "string",
        default: "Oakfile"
      })
      .options("port", {
        alias: "p",
        description: "port of live server",
        type: "number",
        default: 3000
      })
  )
  .help().argv;
console.log(argv);
