import { parseOakfile } from "./utils";
import { Library } from "./Library";
import { join } from "path";

type OakPrintArgumentsType = {
  filename: string;
};
const styles = {
  bgWhite: { open: "\u001b[47m", close: "\u001b[49m" },
  bold: { open: "\u001b[1m", close: "\u001b[22m" },
  black: { open: "\u001b[30m", close: "\u001b[39m" },
};

const styleVariable = (v: string) =>
  `${styles.bold.open}${styles.black.open}${styles.bgWhite.open}${v}${
    styles.bgWhite.close
  }${styles.black.close}${styles.bold.close}`;

export async function oak_print(args: OakPrintArgumentsType): Promise<void> {
  const oakfile = await parseOakfile(join(process.cwd(), args.filename));
  const libSet = new Set(Object.keys(new Library()));
  console.log(`Oakfile at ${args.filename}:`);
  oakfile.module.cells.map(cell => {
    // TODO filename and recipe
    if (cell.body.type === "ImportDeclaration") {
      console.warn("WARNING oak print cant print import statements yet");
    } else {
      console.log(
        `${styleVariable(cell.id.name)} ${cell.references
          .map(ref => ref.name)
          .filter((refName: string) => !libSet.has(refName))
          .join(",")}`
      );
    }
  });
}
