import { parseOakfile } from "./utils";
import { Library } from "./Library";
import { join, dirname } from "path";
import { digraph } from "graphviz";
import { merge } from "d3-array";

type OakPrintArgumentsType = {
  filename: string;
  output: string;
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

const getDot = (modules, libSet) => {
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

const print_dot = (modules, libSet) => {
  const g = getDot(modules, libSet);
  console.log(g.to_dot());
  return;
};

const print_stdout = (filename, modules: any[], libSet) => {
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
        `${styleVariable(cell.id.name)} ${cell.references
          .map(ref => ref.name)
          .filter((refName: string) => !libSet.has(refName))
          .join(",")}`
      );
    });
    console.log("----");
  });
};

const parseModules = async (
  filename: string,
  parsedOakfileSet?: Set<string>
): Promise<any[]> => {
  if (!parsedOakfileSet) {
    parsedOakfileSet = new Set([]);
  }
  if (parsedOakfileSet.has(filename)) {
    throw Error(
      `Circular imports. repeated Oakfile: "${filename}". Visited: ${Array.from(
        parsedOakfileSet
      )
        .map(f => `"${f}"`)
        .join(",")}`
    );
  }
  parsedOakfileSet.add(filename);

  const oakfile = await parseOakfile(filename);
  const dir = dirname(filename);
  const importCells = oakfile.module.cells.filter(
    cell => cell.body.type === "ImportDeclaration"
  );
  const importedModules = await Promise.all(
    importCells.map(importCell => {
      const path = join(dir, importCell.body.source.value);
      return parseModules(path, parsedOakfileSet);
    })
  );
  return [oakfile.module, ...merge(importedModules)];
};
export async function oak_print(args: OakPrintArgumentsType): Promise<void> {
  const modules = await parseModules(join(process.cwd(), args.filename));
  const libSet = new Set(Object.keys(new Library()));
  switch (args.output) {
    case "stdout":
      print_stdout(args.filename, modules, libSet);
      break;
    case "dot":
      print_dot(modules, libSet);
      break;
  }
}
