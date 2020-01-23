import Task from "../Task";
import { duration, formatPath, getStat } from "../utils";
import * as log from "npmlog";
import chalk from "chalk";

export default function(
  cellFunction: (...args: any) => any,
  cellName: string,
  cellReferences: string[],
  baseModuleDir: string
): (...any) => any {
  return async function(...dependencies) {
    let taskDependents: number[] = [];
    dependencies.map((dependency, i) => {
      if (dependency instanceof Task) {
        taskDependents.push(i);
      }
    });
    let currCell = await cellFunction(...dependencies);

    if (currCell instanceof Task) {
      await currCell.updateBasePath(baseModuleDir);

      const watchFiles = currCell.watch;
      const watchStats = await Promise.all(
        watchFiles.map(async watchFile => {
          const stat = await getStat(watchFile);
          return { path: watchFile, stat };
        })
      );

      if (currCell.stat === null) {
        log.info(
          "oak-status",
          `${cellName} - ${chalk.red("Does not exist")} - [${taskDependents
            .map(i => cellReferences[i])
            .join(", ")}] - ${formatPath(currCell.target)}`
        );
        return currCell;
      }

      const outOfDateTaskDependencies = taskDependents.filter(
        i => currCell.stat.mtime <= dependencies[i].stat.mtime
      );
      const outOfDateWatchFiles = watchStats.filter(
        ({ stat }) => currCell.stat.mtime <= stat.mtime
      );
      const mtime = new Date(currCell.stat.mtime);
      if (
        outOfDateTaskDependencies.length > 0 ||
        outOfDateWatchFiles.length > 0
      ) {
        log.info(
          "oak-status",
          `${cellName} ${duration(mtime)} ${formatPath(
            currCell.target
          )} - ${chalk.red("out of date")}:`
        );
        if (outOfDateTaskDependencies.length > 0)
          log.info(
            "oak-status",
            `Cell Dependencies: ${outOfDateTaskDependencies
              .map(i => `\t${cellReferences[i]}`)
              .join(",")}`
          );
        if (outOfDateWatchFiles.length > 0)
          log.info(
            "oak-status",
            `Watch Files: ${outOfDateWatchFiles
              .map(d => `\t${formatPath(d.path)}`)
              .join(",")}`
          );

        await currCell.runTask();
        currCell.stat = await getStat(currCell.target);
        return currCell;
      } else {
        log.info(
          "oak-status",
          `${cellName} - ${duration(mtime)} ${chalk.green(
            "not out of date"
          )} - ${formatPath(currCell.target)}`
        );
        return currCell;
      }
    }
    return currCell;
  };
}
