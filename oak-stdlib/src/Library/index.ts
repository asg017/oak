import shell from "./shell";
import task from "./task";
import command from "./command";

const constant = function(x: any) {
  return function() {
    return x;
  };
};

export const LibraryKeys = new Set(["task", "shell", "command"]);

export default function Library() {
  Object.defineProperties(this, {
    shell: { value: constant(shell), writable: true, enumerable: true },
    task: { value: constant(task), writable: true, enumerable: true },
    command: { value: constant(command), writable: true, enumerable: true }
  });
}
