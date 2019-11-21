// For the --file=path/to/file.txt CLI argument.
import untildify from "untildify";
import { isAbsolute, join } from "path";

export function fileArgument(inputPath: string): string {
  const expand = untildify(inputPath);
  return isAbsolute(expand) ? expand : join(process.cwd(), expand);
}
