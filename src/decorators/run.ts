import Task from "../Task";
import { formatPath, getStat } from "../utils";
import * as log from "npmlog";

export default function(
  cellFunction: (...any) => any,
  baseModuleDir: string
): (...any) => any {
  return async function(...dependencies) {
    // dont try and get Task for cell depends like `cell` or `shell`
    let cellDependents = [];
    dependencies.map(dependency => {
      if (dependency instanceof Task) {
        cellDependents.push(dependency);
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

      // run recipe if no file or if it's out of date
      if (currCell.stat === null) {
        log.info(
          "oak-run decorator",
          `${formatPath(currCell.target)} - Doesn't exist - running recipe...`
        );
        await currCell.runTask();
        currCell.stat = await getStat(currCell.target);
        return currCell;
      }
      const outOfDateCellDependencies = cellDependents.filter(
        c => currCell.stat.mtime <= c.stat.mtime
      );
      const outOfDateWatchFiles = watchStats.filter(
        ({ stat }) => currCell.stat.mtime <= stat.mtime
      );
      if (
        outOfDateCellDependencies.length > 0 ||
        outOfDateWatchFiles.length > 0
      ) {
        log.info(
          "oak-run decorator",
          `${formatPath(currCell.target)} - out of date:`
        );
        if (outOfDateCellDependencies.length > 0)
          log.info(
            "oak-run decorator",
            `Cell Dependencies: ${outOfDateCellDependencies
              .map(d => `\t${formatPath(d.path)}`)
              .join(",")}`
          );
        if (outOfDateWatchFiles.length > 0)
          log.info(
            "oak-run decorator",
            `Watch Files: ${outOfDateWatchFiles
              .map(d => `\t${formatPath(d.path)}`)
              .join(",")}`
          );

        await currCell.runTask();
        currCell.stat = await getStat(currCell.target);
        return currCell;
      } else {
        log.info(
          "oak-run decorator",
          `${formatPath(currCell.target)} - not out of date `
        );
        return currCell;
      }
    }
    return currCell;
  };
}
