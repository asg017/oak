const constant = function(x: any) {
  return function() {
    return x;
  };
};

import { createWriteStream } from "fs";
import shell from "./shell";
import task from "./task";
import command from "./command";

export default function Library() {
  Object.defineProperties(this, {
    shell: { value: constant(shell), writable: true, enumerable: true },
    task: { value: constant(task), writable: true, enumerable: true },
    command: { value: constant(command), writable: true, enumerable: true },
    createWriteStream: {
      value: constant(createWriteStream),
      writable: true,
      enumerable: true,
    },
  });
}
