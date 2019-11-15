import { getStat } from "../utils";
import Task from "../Task";

type WatchArg = string | string[];

export default async function task(params: {
  path: string;
  run: (any) => any;
  watch?: WatchArg;
}): Promise<Task> {
  const { path, run } = params;
  let { watch = [] } = params;
  watch = Array.isArray(watch) ? watch : [watch];

  const stat = await getStat(path);
  return new Task(path, stat, run, watch);
}
