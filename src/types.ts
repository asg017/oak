export type OakVariableType = {
  name: string;
  deps: Array<string>;
  recipe: string;
  filename: string;
};
export type OakType = {
  variables: Array<OakVariableType>;
};
