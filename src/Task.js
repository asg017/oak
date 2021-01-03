import { stat } from "os";
import { ShellPipeline, ShellPipelineError } from "./sh.js";

export function createTaskDefintion(outDir) {
  return async function Task(params = {}) {
    let isFresh;
    let targetStat, statError;
    const { path, run, deps = [] } = params;

    const depStats = deps.map((d) => stat(d)[0]);

    // TODO find path.join() equivalent
    const p = `${outDir}/${path}`;

    [targetStat, statError] = stat(p);
    isFresh =
      !statError && !depStats.findIndex((d) => d.mtime > targetStat.mtime) >= 0;

    if (isFresh) {
      print(`Task target fresh: ${p}`);
    } else {
      print(`Task target not fresh, running: ${p}`);

      try {
        const res = await run(p);
        if (res instanceof ShellPipeline) await res.end();
      } catch (e) {
        if (e instanceof ShellPipelineError) {
          print(e.i, e.message);
          throw e;
        }
      }

      const [postStat, postStatError] = stat(p);
      if (postStatError)
        throw Error(
          `Task run did not create file at ${p}, error ${postStatError}`
        );
      if (targetStat && postStat.mtime <= targetStat.mtime)
        throw Error(
          `Task run did not update file at ${p}, previous mtime=${targetStat.mtime}, mtime=${postStat.mtime}`
        );
    }

    return p;
  };
}
