import { readdirSync, stat, Stats } from "fs";
import { isAbsolute, join } from "path";
import untildify from "untildify";

export function fileArgument(inputPath: string): string {
  const expand = untildify(inputPath);
  return isAbsolute(expand) ? expand : join(process.cwd(), expand);
}

export async function getDirectoryStat(
  directoryPath: string,
  directoryStat: Stats
): Promise<Stats> {
  // TODO: this should instead walk the directory. It should
  // go into any subdirectories and also include their mtimes
  // and their sizes. Right now, any subdirectory is ignored.
  const filesInDirectory = readdirSync(directoryPath);
  const fileStats: Stats[] = [];
  await Promise.all(
    filesInDirectory.map(filename => {
      const path = join(directoryPath, filename);
      return new Promise((resolve, reject) => {
        stat(path, (err: any, stat: Stats) => {
          if (err) {
            // reject even if a "file not found" error is thrown
            // since that shouldnt happen here bc were getting these
            // files from readdirSync right before
            reject(err);
          }
          fileStats.push(stat);
          resolve(stat);
        });
      });
    })
  );

  // assume the max mtime is the directory itself.
  // then, see if any of its file is newer.
  let maxMTime = directoryStat.mtime.getTime();
  let totalSize = 0;
  for (let currStat of fileStats) {
    totalSize += currStat.size;
    if (currStat.mtime.getTime() > maxMTime)
      maxMTime = currStat.mtime.getTime();
  }

  return Object.assign(directoryStat, {
    mtime: new Date(maxMTime),
    size: totalSize
  });
}
export const getStat = (filename: string): Promise<Stats | null> =>
  new Promise(function(res, rej) {
    stat(filename, (err: any, stat: any) => {
      if (err) {
        if (err.code === "ENOENT") {
          res(null);
          return;
        }
        rej(err);
      }
      if (stat.isDirectory()) {
        return getDirectoryStat(filename, stat).then(stat => res(stat));
      }
      res(stat);
    });
  });
