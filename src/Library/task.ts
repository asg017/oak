import { getStat } from "../utils";
import FileInfo from "../FileInfo";

type WatchArg = string | string[];

export default async function task(params: {
  path: string;
  run: (any) => any;
  watch?: WatchArg;
}): Promise<FileInfo> {
  const { path, run } = params;
  let { watch = [] } = params;
  watch = Array.isArray(watch) ? watch : [watch];

  const stat = await getStat(path);
  return new FileInfo(path, stat, run, watch);
}
