const constant = function(x: any) {
  return function() {
    return x;
  };
};

import { shell as shl } from "shl";
import command from "./command";
import Task from "../Task";
import { Scheduler, SchedulerMock } from "./Scheduler";
import env from "./env";

function shell(...args) {
  const shlPipeline = shl(...args);
  return {
    process: shlPipeline.process,
    outStream: null,
    config: { stdout: true, stderr: false },
  };
}

export default function Library() {
  Object.defineProperties(this, {
    shell: { value: constant(shell), writable: true, enumerable: true },
    Task: { value: constant(Task), writable: true, enumerable: true },
    command: { value: constant(command), writable: true, enumerable: true },
    Scheduler: { value: constant(Scheduler), writable: true, enumerable: true },
    env: { value: constant(env), writable: true, enumerable: true },
  });
}

export function RunLibrary() {
  Object.defineProperties(this, {
    shell: { value: constant(shell), writable: true, enumerable: true },
    Task: { value: constant(Task), writable: true, enumerable: true },
    command: { value: constant(command), writable: true, enumerable: true },
    Scheduler: {
      value: constant(SchedulerMock),
      writable: true,
      enumerable: true,
    },
    env: { value: constant(env), writable: true, enumerable: true },
  });
}

export function RunScheduleLibrary() {
  Object.defineProperties(this, {
    shell: { value: constant(shell), writable: true, enumerable: true },
    Task: { value: constant(Task), writable: true, enumerable: true },
    command: { value: constant(command), writable: true, enumerable: true },
    Scheduler: {
      value: constant(Scheduler),
      writable: true,
      enumerable: true,
    },
    env: { value: constant(env), writable: true, enumerable: true },
  });
}
