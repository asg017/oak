import { CellSignature, getSignature, hashString } from "./utils";
import { OakDB } from "./db";
import Task from "./Task";
import { dirname, join } from "path";

export type TaskHookDecoratorArguments = {
  cellFunction: (...any) => any;
  cellName: string;
  cellReferences: string[];
  cellSignature: CellSignature;
  baseModuleDir: string;
  oakfilePath: string;
  importId: string;
};
type TaskHookCellArguments = any[];
export type TaskHookTaskContext = {
  dependenciesSignature: string;
};
type TaskHookArguments = [
  any,
  TaskHookDecoratorArguments,
  TaskHookCellArguments,
  TaskHookTaskContext
];

type TaskHook = (...args: TaskHookArguments) => any;

export default function decorator(
  hooks: {
    onTaskUpToDate: TaskHook;
    onTaskCellDefinitionChanged: TaskHook;
    onTaskDependencyChanged: TaskHook;
    onTaskTargetChanged: TaskHook;
    onTaskTargetMissing: TaskHook;
  },
  oakDB: OakDB,
  customFreshHook?: {
    check: (...args: TaskHookArguments) => boolean;
    value: (...args: TaskHookArguments) => any;
  }
) {
  return function(
    cellFunction: (...any) => any,
    cellName: string,
    cellReferences: string[],
    cellSignature: CellSignature,
    baseModuleDir: string,
    oakfilePath: string,
    importId: string
  ): (...any) => any {
    return async function(...dependencies) {
      let currCell = await cellFunction(...dependencies);
      if (!(currCell instanceof Task)) {
        return currCell;
      }
      const lastTaskExection = await oakDB.getLastRelatedTaskExection(
        cellSignature.ancestorHash
      );

      await currCell.updateBasePath(baseModuleDir);

      // dont try and get Task for cell dependencies like `Task` or `shell`
      const taskDependencies = dependencies.filter(
        dependency => dependency instanceof Task
      );

      const dependenciesSignatures: string[] = await Promise.all([
        ...taskDependencies
          .map(t => t.target)
          .map(async path => {
            const sig = await getSignature(path);
            if (!sig) return "<nosignature>";
            /*throw Error(
                `Problem getting signature for ${path}. Does the file exist?`
              );*/
            return sig;
          }),
        ...currCell.watch.map(async path => {
          const sig = await getSignature(join(dirname(oakfilePath), path));
          if (!sig) return "<nosignature>";
          /*throw Error(
              `Problem getting signature for ${path}. Does the file exist?`
            );*/
          return sig;
        }),
      ]);
      const dependenciesSignature = hashString(dependenciesSignatures.join(""));
      const currentTargetSignature = await getSignature(currCell.target);

      const decoratorArgs = {
        cellFunction,
        cellName,
        cellReferences,
        cellSignature,
        baseModuleDir,
        oakfilePath,
        importId,
      };
      const taskContext = {
        dependenciesSignature,
      };

      if (
        customFreshHook &&
        customFreshHook.check(
          currCell,
          decoratorArgs,
          dependencies,
          taskContext
        )
      ) {
        return await customFreshHook.value(
          currCell,
          decoratorArgs,
          dependencies,
          taskContext
        );
      }
      // no output target. Don't do if the task has no target.
      if (currCell.target && currentTargetSignature === null) {
        return await hooks.onTaskTargetMissing(
          currCell,
          decoratorArgs,
          dependencies,
          taskContext
        );
      }

      // cell definition changed
      if (!lastTaskExection) {
        return await hooks.onTaskCellDefinitionChanged(
          currCell,
          decoratorArgs,
          dependencies,
          taskContext
        );
      }

      // out of date dependency
      if (lastTaskExection.dependenciesSignature !== dependenciesSignature) {
        return await hooks.onTaskDependencyChanged(
          currCell,
          decoratorArgs,
          dependencies,
          taskContext
        );
      }

      // target has changed. Ignorable
      if (
        !currCell.freshIgnoreTarget &&
        lastTaskExection.targetSignature !== currentTargetSignature
      ) {
        return await hooks.onTaskTargetChanged(
          currCell,
          decoratorArgs,
          dependencies,
          taskContext
        );
      }

      return await hooks.onTaskUpToDate(
        currCell,
        decoratorArgs,
        dependencies,
        taskContext
      );
    };
  };
}
