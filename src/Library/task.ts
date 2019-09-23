import { getStat } from "../utils";
import FileInfo from "../FileInfo";

export default async function task(params: {
  path: string;
  make: (any) => any;
}): Promise<FileInfo> {
  const { path, make } = params;
  const stat = await getStat(path);
  return new FileInfo(path, stat, make);
}
