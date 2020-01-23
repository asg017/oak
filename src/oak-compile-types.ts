export type InjectingSource = {
  sourcePath: string;
  cells: string[];
};

export type Decorator = (
  cellFunction: (...any) => any,
  cellName: string,
  cellReferences: string[],
  baseModuleDir: string
) => (...any) => any;

export type Inspector = {
  pending: () => void;
  fulfilled: (value: any) => void;
  rejected: (error: any) => void;
};
export type DefineFunctionType = (
  runtime: any,
  observer: (name: string) => Inspector | null
) => any;

export type ObservableImportDeclaration = {
  type: "ImportDeclaration";
  specifiers: {
    type: "ImportSpecifier";
    view: boolean;
    imported: { type: "Identifier"; name: string };
    local: { type: "Identifier"; name: string };
  }[];
  source: { type: "Literal"; value: string; raw: string };
  start: number;
  end: number;
};
export type ObservableLiteral = {
  type: "Literal";
  value: any;
  raw: string;
  start: number;
  end: number;
};
export type ObservableBlockStatement = {
  type: "BlockStatement";
  body: any[];
  start: number;
  end: number;
};
export type ObservableCell = {
  type: "Cell";
  id: {
    type: "Identifier";
    name: string;
    id: {
      name: string;
    };
  } | null;
  async: boolean;
  generator: boolean;
  references: { type: string; name: string }[];
  body: ObservableLiteral &
    ObservableImportDeclaration &
    ObservableBlockStatement;
};
