import Task from "../Task";
import { getStat } from "../utils";
import * as log from "npmlog";

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
      console.log(
        `${cellName} - [${taskDependents
          .map(t => cellReferences[t])
          .join(", ")}]`
      );
    }
  };
}
