fs = require("fs");

export const oakLogger = createLogger({ label: "Oak" });

export const loadOakfile = (config = {}) => {
  const { path = "Oakfile", cleanRecipe = true } = config;
  return new Promise( (res, rej) => {
    fs.readFile(path, "utf8", (err, contents) => {
      if (err) rej(err);
      let oak;
      try {
        oak = JSON.parse(contents);
      } catch (err) {
        console.error(err);
        rej(err);
        return;
      }
      if (cleanRecipe) {
        for (let key in oak.variables) {
          let { recipe } = oak.variables[key];
          for (let key2 in oak.variables) {
            recipe = recipe.replace(
              `\${${key2}}`,
              oak.variables[key2].filename
            );
          }
          oak.variables[key].recipe = recipe;
        }
      }
      res(oak);
    });
  });
};

const getStat = filename =>
  new Promise(function(res, rej) {
    fs.stat(filename, (err, stat) => {
      if (err) rej(err);
      res(stat);
    });
  });
