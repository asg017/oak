import { loadOakfile } from "./utils";

const styles = {
  bgWhite: { open: "\u001b[47m", close: "\u001b[49m" },
  bold: { open: "\u001b[1m", close: "\u001b[22m" },
  black: { open: "\u001b[30m", close: "\u001b[39m" }
};

const styleVariable = v =>
  `${styles.bold.open}${styles.black.open}${styles.bgWhite.open}${v}${
    styles.bgWhite.close
  }${styles.black.close}${styles.bold.close}`;

export async function oak_print(argv) {
  const oakfile = await loadOakfile({
    path: argv.oakfile,
    cleanRecipe: true
  }).catch(e => {
    console.error(`Error loading oakfile in oak_print:`, e);
  });
  if (!oakfile) {
    throw Error("Couldnt parse oakfile correctly");
  }
  const { variables } = oakfile;
  console.log(`Oakfile at ${argv.oakfile}:`);
  variables.map(target => {
    console.log(`${styleVariable(target.name)} = ${target.filename}`);
    console.log(`\trecipe:"${target.recipe}"`);
    target.deps && console.log(`\t ${target.deps.join(", ")}`);
  });
}
