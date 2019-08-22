const constant = function(x: any) {
  return function() {
    return x;
  };
};

import bash from "./bash";
import recipe from "./recipe";

export default function Library() {
  Object.defineProperties(this, {
    bash: { value: constant(bash), writable: true, enumerable: true },
    recipe: { value: constant(recipe), writable: true, enumerable: true },
  });
}
