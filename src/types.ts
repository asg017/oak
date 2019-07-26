export type OakfileConfigureType = {
  path: string;
  cleanRecipe: boolean;
};

export type OakVariableType = {
  deps: Array<string>;
  recipe: string;
  filename: string;
};
export type OakType = {
  variables: Array<OakVariableType>;
};
