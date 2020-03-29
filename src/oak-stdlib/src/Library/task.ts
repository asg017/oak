import { getStat, Task } from "@alex.garcia/oak-utils";

type WatchArg = string | string[];

export default async function task(params: {
  target: string;
  run: (any) => any;
  directory?: boolean;
  dir?: boolean;
  watch?: WatchArg;
}): Promise<Task> {
  let { target, run, dir, directory } = params;
  directory = directory || dir;
  let { watch = [] } = params;
  watch = Array.isArray(watch) ? watch : [watch];

  const stat = await getStat(target);
  return new Task(target, stat, run, watch);
}
