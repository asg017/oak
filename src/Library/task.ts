import { getStat } from "../utils";
import FileInfo from "../FileInfo";

export default async function task(params: {
  path: string;
  run: (any) => any;
}): Promise<FileInfo> {
  const { path, run } = params;
  const stat = await getStat(path);
  return new FileInfo(path, stat, run);
}
