import { spawn } from "child_process";
import { Execution } from "../Execution";
import Task from "../Task";

function transform(strings: string[], ...values: any[]): Execution {
  let s = strings[0];
  for (let i = 0, n = values.length; i < n; ++i) {
    if (typeof values[i] === "string") {
      s += `${values[i]}${strings[i + 1]}`;
    } else if (values[i] instanceof Task) {
      const cleanedTargetPath = values[i].target
        ? values[i].target.replace(`"`, `"`)
        : "";
      s += `"${cleanedTargetPath}"${strings[i + 1]}`;
    } else {
      s += `${values[i]}${strings[i + 1]}`;
    }
  }
  const process = spawn(s, { shell: true });
  return { process, outStream: null, config: { stdout: true, stderr: false } };
}

export default function shell(args = {}): () => Execution {
  return Array.isArray(args)
    ? ((args = {}), transform.apply(this, arguments))
    : transform;
}
