import Task from "../Task";
import { getStat } from "../utils";

export default function(
  cellFunction: (...args: any) => any,
  cellName: string,
  cellReferences: string[],
  baseModuleDir: string
): (...any) => any {
  return async function(...dependencies) {
    let taskDependents: number[] = [];
    dependencies.map((dependency, i) => {
      if (dependency.__task) {
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

      // assuming that the library passed into this runtime
      // isnt running the tasks, but actually returning the "type" of tasks
      const taskType = await currCell.runTask();
      if (currCell.stat === null) {
        return {
          __task: true,
          name: cellName,
          taskDeps: taskDependents.map(i => cellReferences[i]),
          target: currCell.target,
          mtime: 0,
          type: taskType,
          bytes: 0,
          status: "dne",
        };
      }

      const outOfDateTaskDependencies = taskDependents.filter(
        i =>
          currCell.stat.mtime.getTime() <= dependencies[i].mtime ||
          dependencies[i].status !== "up"
      );
      const outOfDateWatchFiles = watchStats.filter(
        ({ stat }) => currCell.stat.mtime.getTime() <= stat.mtime
      );
      if (
        outOfDateTaskDependencies.length > 0 ||
        outOfDateWatchFiles.length > 0
      ) {
        return {
          __task: true,
          name: cellName,
          taskDeps: taskDependents.map(i => cellReferences[i]),
          target: currCell.target,
          mtime: currCell.stat.mtime.getTime(),
          type: taskType,
          bytes: currCell.stat.size,
          status: "out",
        };
      }
      return {
        __task: true,
        name: cellName,
        taskDeps: taskDependents.map(i => cellReferences[i]),
        target: currCell.target,
        mtime: currCell.stat.mtime.getTime(),
        type: taskType,
        bytes: currCell.stat.size,
        status: "up",
      };
    }
    return currCell;
  };
}
