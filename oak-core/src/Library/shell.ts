import { spawn } from "child_process";
import { Execution } from "../Execution";

function transform(strings: string[], ...values: any[]): Execution {
  let s = strings[0];
  for (let i = 0, n = values.length; i < n; ++i)
    s +=
      typeof values[i] === "string"
        ? `${values[i]}${strings[i + 1]}`
        : `"${values[i].target.replace(`"`, `"`)}"${strings[i + 1]}`;
  const process = spawn(s, { shell: true });
  return { process, outStream: null, config: { stdout: true, stderr: false } };
}

export default function shell(args = {}): () => Execution {
  return Array.isArray(args)
    ? ((args = {}), transform.apply(this, arguments))
    : transform;
}
