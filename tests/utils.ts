import { readFile, stat, Stats, unlinkSync, utimes } from "fs";
import { join } from "path";

type OpenFileType = {
  content: string;
  stat: Stats;
};

export const envFile = (dirname: string) => 
Object.assign((path: string) =>
  join(dirname, "env", path), {data: (path: string) => join(dirname, 'env', 'oak_data', path)});

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
    readFile(path, "utf8", (err: NodeJS.ErrnoException, data: string) => {
      if (err) {
        if (err.code === "ENOENT") resolve(null);
        else reject(err);
      }
      resolve(data);
    });
  });
  const s: Stats = await new Promise((resolve, reject) => {
    stat(path, (err: NodeJS.ErrnoException, s: Stats) => {
      if (err) {
        if (err.code === "ENOENT") resolve(null);
        else reject(err);
      }
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
      // console.error("cleanUp error: ", err);
    }
  });
}

export const getTree = async (
  outFiles: string[],
  env: (string) => string
): Promise<Map<string, any>> => {
  const files = await Promise.all(
    outFiles.map(async out => [out, await open(env(out))])
  );
  const map = new Map();
  files.map(file => {
    map.set(file[0], file[1]);
  });
  return map;
};
