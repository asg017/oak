const constant = function(x: any) {
  return function() {
    return x;
  };
};

import shell from "./shell";
import command from "./command";
import Task from "../Task";
import { Scheduler } from "./Scheduler";

export default function Library() {
  Object.defineProperties(this, {
    shell: { value: constant(shell), writable: true, enumerable: true },
    Task: { value: constant(Task), writable: true, enumerable: true },
    command: { value: constant(command), writable: true, enumerable: true },
    Scheduler: { value: constant(Scheduler), writable: true, enumerable: true },
  });
}
