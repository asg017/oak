import { readFile, stat, Stats, unlinkSync, utimes } from "fs";
import { join } from "path";

type OpenFileType = {
  content: string;
  stat: Stats;
};

export const envFile = (dirname: string) => (path: string) =>
  join(dirname, "env", path);

export const touch = async (
  path: string,
  atime: Date,
  mtime: Date
): Promise<OpenFileType> => {
  await utimes(
    path,
    atime.getTime() / 1000,
    mtime.getTime() / 1000,
    err => new Promise((resolve, reject) => (err ? reject(err) : resolve()))
  );
  return open(path);
};
export const open = async (path: string): Promise<OpenFileType> => {
  const content: string = await new Promise((resolve, reject) => {
    readFile(path, "utf8", (err: any, data: string) => {
      if (err) reject(err);
      resolve(data);
    });
  });
  const s: Stats = await new Promise((resolve, reject) => {
    stat(path, (err: any, s: Stats) => {
      if (err) reject(err);
      resolve(s);
    });
  });
  return { content, stat: s };
};

export function cleanUp(
  filepath: (path: string) => string,
  fileNames: string[]
) {
  fileNames.map(name => {
    try {
      unlinkSync(join(filepath(name)));
    } catch (err) {
      console.error("cleanUp error: ", err);
    }
  });
}
