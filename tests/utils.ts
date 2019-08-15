import { readFile, stat, Stats, unlinkSync, utimes } from "fs";
import { join } from "path";

type OpenFileType = {
  content: string;
  stat: Stats;
};
export const input_file = {
  hello: (path: string) => `${__dirname}/input/hello/${path}`,
  simple_import: (path: string) => `${__dirname}/input/simple-import/${path}`,
  simple_inject: (path: string) => `${__dirname}/input/simple-inject/${path}`,
  library: (path: string) => `${__dirname}/input/Library/${path}`
};
export const touch = async (
  path: string,
  atime: Date | number,
  mtime: Date | number
): Promise<OpenFileType> => {
  await utimes(
    path,
    atime,
    mtime,
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
    } catch {} // o no
  });
}
