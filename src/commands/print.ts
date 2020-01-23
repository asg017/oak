import { Library } from "../Library";
import { digraph } from "graphviz";
import { parseModules } from "../utils";
import { fileArgument } from "../cli-utils";

type OakPrintArgumentsType = {
  filename: string;
  output: string;
};

const defaultLibSet = new Set(Object.keys(new Library()));

const styles = {
  bgWhite: { open: "\u001b[47m", close: "\u001b[49m" },
  bold: { open: "\u001b[1m", close: "\u001b[22m" },
  black: { open: "\u001b[30m", close: "\u001b[39m" },
};

const styleVariable = (v: string) =>
  `${styles.bold.open}${styles.black.open}${styles.bgWhite.open}${v}${styles.bgWhite.close}${styles.black.close}${styles.bold.close}`;

export const getDot = (modules, libSet = defaultLibSet) => {
  const g = digraph("G");
  modules.map((module, i) => {
    const cluster = g.addCluster(`cluster_${i}`);
    module.cells.map(cell => {
      // TODO filename and recipe
      if (cell.body.type === "ImportDeclaration") {
        cell.body.specifiers.map(spec => {
          cluster.addEdge(spec.imported.name, spec.local.name);
        });
      } else {
        const node = cluster.addNode(cell.id.name);
        cell.references
          .filter(ref => !libSet.has(ref.name))
          .map(ref => cluster.addEdge(ref.name, node));
      }
    });
  });
  return g;
};

const print_dot = (modules, libSet = defaultLibSet) => {
  const g = getDot(modules, libSet);
  console.log(g.to_dot());
  return;
};

const print_png = (modules, libSet = defaultLibSet) => {
  const g = getDot(modules, libSet);
  console.log('Printing "oak.png"...');
  // TODO warn if overwriting previous png
  // TODO probably wont work on windows
  g.setGraphVizPath("/usr/local/bin");
  g.output("png", "oak.png");
  return;
};

const print_stdout = (filename, modules: any[], libSet = defaultLibSet) => {
  console.log(`Oakfile at ${filename}:`);
  console.log("----");
  modules.map(module => {
    module.cells.map(cell => {
      if (cell.body.type === "ImportDeclaration") {
        console.log(
          `import ${cell.body.specifiers
            .map(spec => `${spec.local.name} as ${spec.imported.name}`)
            .join(",")} from ${cell.body.source.raw}`
        );
        return;
      }
      console.log(
        `${styleVariable((cell.id && cell.id.name) || "")} - [${cell.references
          .map(ref => ref.name)
          .filter((refName: string) => !libSet.has(refName))
          .join(",")}]`
      ); 
    });
    console.log("----");
  });
};

export async function oak_print(args: OakPrintArgumentsType): Promise<void> {
  const filename = fileArgument(args.filename);
  const modules = await parseModules(filename);
  switch (args.output) {
    case "stdout":
      print_stdout(args.filename, modules);
      break;
    case "dot":
      print_dot(modules);
      break;
    case "png":
      print_png(modules);
  }
}
