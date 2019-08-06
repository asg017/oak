import { getStat } from "../utils";
import FileInfo from "../FileInfo";

export default async function cell(params: {
  path: string;
  recipe: (any) => any;
}): Promise<FileInfo> {
  const { path, recipe } = params;
  const stat = await getStat(path);
  return new FileInfo(path, stat, recipe);
}
