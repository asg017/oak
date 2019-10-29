import FileInfo from "../FileInfo";
import { formatPath, getStat } from "../utils";

export default function(
  cellFunction: (...any) => any,
  baseModuleDir: string
): (...any) => any {
  return async function(...dependencies) {
    // dont try and get fileinfo for cell depends like `cell` or `shell`
    let cellDependents = [];
    dependencies.map(dependency => {
      if (dependency instanceof FileInfo) {
        cellDependents.push(dependency);
      }
    });
    let currCell = await cellFunction(...dependencies);

    if (currCell instanceof FileInfo) {
      await currCell.updateBasePath(baseModuleDir);

      // run recipe if no file or if it's out of date
      if (currCell.stat === null) {
        console.log(
          `${formatPath(currCell.path)} - Doesn't exist - running recipe...`
        );
        await currCell.runRecipe();
        currCell.stat = await getStat(currCell.path);
        return currCell;
      }
      const deps = cellDependents.filter(
        c => currCell.stat.mtime <= c.stat.mtime
      );
      if (deps.length > 0) {
        console.log(`${formatPath(currCell.path)} - out of date:`);
        console.log(deps.map(d => `\t${formatPath(d.path)}`).join(","));
        await currCell.runRecipe();
        currCell.stat = await getStat(currCell.path);
        return currCell;
      } else {
        console.log(`${formatPath(currCell.path)} - not out of date `);
        return currCell;
      }
    }
    return currCell;
  };
}
