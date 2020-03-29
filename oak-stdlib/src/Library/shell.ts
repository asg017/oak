import { spawn } from "child_process";
import { Execution } from "@alex.garcia/oak-utils";

export default function shell(
  strings: TemplateStringsArray,
  ...values: any[]
): Execution {
  let s = strings[0];
  for (let i = 0, n = values.length; i < n; ++i)
    s +=
      typeof values[i] === "string"
        ? `${values[i]}${strings[i + 1]}`
        : `"${values[i].target.replace(`"`, `"`)}"${strings[i + 1]}`;
  const process = spawn(s, { shell: true });
  return { process, outStream: null, config: { stdout: true, stderr: false } };
}
