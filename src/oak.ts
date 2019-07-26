#!/usr/bin/env node

import { oak_static } from "./oak-static";
import { oak_print } from "./oak-print";

import * as yargs from "yargs";

const argv = yargs
  .command(
    ["static [oakfile] [targets..]", "$0"],
    "Run oak statically",
    yargs =>
      yargs
        .positional("oakfile", {
          describe: "Path to Oakfile",
          default: "Oakfile"
        })
        .positional("targets", {
          description: "several targets"
        })
  )
  .strict()
  .demandCommand()
  .command("print [oakfile]", "Print an Oakfile depedency graph", yargs =>
    yargs.positional("oakfile", {
      describe: "Path to Oakfile",
      default: "Oakfile"
    })
  )
  .strict()
  .help().argv;

const command = argv._[0];

switch (command) {
  case "static":
    oak_static(argv)
      .then(() => {
        console.log(`oak static complete.`);
      })
      .catch(e => {
        console.error("Oak static error:", e);
      });
    break;
  case "print":
    oak_print(argv);
    break;
  default:
    throw Error(`${command} not a valid command`);
    break;
}
