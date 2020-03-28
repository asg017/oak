const constant = function(x: any) {
  return function() {
    return x;
  };
};

import shell from "./shell";
import task from "./task";
import command from "./command";
import Docker from "./Docker";

export default function Library() {
  Object.defineProperties(this, {
    shell: { value: constant(shell), writable: true, enumerable: true },
    task: { value: constant(task), writable: true, enumerable: true },
    command: { value: constant(command), writable: true, enumerable: true },
    Docker: { value: constant(Docker), writable: true, enumerable: true },
  });
}
