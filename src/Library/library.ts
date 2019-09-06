const constant = function (x: any) {
  return function () {
    return x;
  };
};

import shell from "./shell";
import recipe from "./recipe";

export default function Library() {
  Object.defineProperties(this, {
    shell: { value: constant(shell), writable: true, enumerable: true },
    recipe: { value: constant(recipe), writable: true, enumerable: true },
  });
}
