import { parseOakfile } from "./utils";
import Library from "./Library";

type OakPrintArgumentsType = {
  filename: string;
};
const styles = {
  bgWhite: { open: "\u001b[47m", close: "\u001b[49m" },
  bold: { open: "\u001b[1m", close: "\u001b[22m" },
  black: { open: "\u001b[30m", close: "\u001b[39m" }
};

const styleVariable = (v: string) =>
  `${styles.bold.open}${styles.black.open}${styles.bgWhite.open}${v}${
    styles.bgWhite.close
  }${styles.black.close}${styles.bold.close}`;

export async function oak_print(args: OakPrintArgumentsType): Promise<void> {
  const oakModule = await parseOakfile(args.filename);
  const libSet = new Set(Object.keys(Library));
  console.log(`Oakfile at ${args.filename}:`);
  oakModule.cells.map(cell => {
    // TODO filename and recipe
    console.log(
      `${styleVariable(cell.id.name)} ${cell.references
        .map(ref => ref.name)
        .filter(refName => !libSet.has(refName))
        .join(",")}`
    );
  });
}
