import { getStat, CellSignature } from "./utils";
import pino from "pino";
import { OakDB } from "./db";
import Task from "./Task";

type TaskHookDecoratorArguments = {
  cellFunction: (...any) => any;
  cellName: string;
  cellReferences: string[];
  cellSignature: CellSignature;
  baseModuleDir: string;
};
type TaskHookCellArguments = any[];
type TaskHookArguments = [
  any,
  TaskHookDecoratorArguments,
  TaskHookCellArguments
];

type TaskHook = (...args: TaskHookArguments) => any;

export default function decorator(
  hooks: {
    onTaskUpToDate: TaskHook;
    onTaskCellDefinitionChanged: TaskHook;
    onTaskDependencyChanged: TaskHook;
    onTaskTargetMissing: TaskHook;
  },
  oakDB: OakDB,
  TaskClass: any = Task
) {
  return function(
    cellFunction: (...any) => any,
    cellName: string,
    cellReferences: string[],
    cellSignature: CellSignature,
    baseModuleDir: string
  ): (...any) => any {
    return async function(...dependencies) {
      let currCell = await cellFunction(...dependencies);

      if (!(currCell instanceof TaskClass)) {
        return currCell;
      }
      await currCell.updateBasePath(baseModuleDir);

      // dont try and get Task for cell dependencies like `Task` or `shell`
      let cellDependents = [];
      dependencies.map(dependency => {
        if (dependency instanceof TaskClass) {
          cellDependents.push(dependency);
        }
      });

      const watchFiles = currCell.watch;
      const watchStats = await Promise.all(
        watchFiles.map(async watchFile => {
          const stat = await getStat(watchFile);
          return { path: watchFile, stat };
        })
      );

      const outOfDateCellDependencies = cellDependents.filter(
        ({ stat }) => currCell.stat && currCell.stat.mtime <= stat.mtime
      );
      const outOfDateWatchFiles = watchStats.filter(
        ({ stat }) => currCell.stat && currCell.stat.mtime <= stat.mtime
      );
      const cellHashLookup = await oakDB.findMostRecentCellHash(
        cellSignature.ancestorHash
      );

      const decoratorArgs = {
        cellFunction,
        cellName,
        cellReferences,
        cellSignature,
        baseModuleDir,
      };
      // no output target
      if (currCell.stat === null) {
        return await hooks.onTaskTargetMissing(
          currCell,
          decoratorArgs,
          dependencies
        );
      }

      // out of date dependency
      if (
        outOfDateCellDependencies.length > 0 ||
        outOfDateWatchFiles.length > 0
      ) {
        return await hooks.onTaskDependencyChanged(
          currCell,
          decoratorArgs,
          dependencies
        );
      }

      // cell definition changed
      if (
        !cellHashLookup ||
        cellHashLookup.mtime > currCell.stat.mtime.getTime()
      ) {
        return await hooks.onTaskCellDefinitionChanged(
          currCell,
          decoratorArgs,
          dependencies
        );
      }
      return await hooks.onTaskUpToDate(currCell, decoratorArgs, dependencies);
    };
  };
}
