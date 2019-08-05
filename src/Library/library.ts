const constant = function(x: any) {
  return function() {
    return x;
  };
};

import bash from "./bash";
import cell from "./cell";

export default function Library() {
  Object.defineProperties(this, {
    bash: { value: constant(bash), writable: true, enumerable: true },
    cell: { value: constant(cell), writable: true, enumerable: true }
  });
}
