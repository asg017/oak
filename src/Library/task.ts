import { getStat } from "../utils";
import Task from "../Task";

type WatchArg = string | string[];

export default async function task(params: {
  target: string;
  run: (any) => any;
  watch?: WatchArg;
}): Promise<Task> {
  const { target, run } = params;
  let { watch = [] } = params;
  watch = Array.isArray(watch) ? watch : [watch];

  const stat = await getStat(target);
  return new Task(target, stat, run, watch);
}
