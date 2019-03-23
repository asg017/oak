const {Runtime} = require('@observablehq/runtime');

const rt = new Runtime()
const m1 = rt.module()

const v1 = m1.variable({
  pending: (a,b,c,d) => console.log("pending...", a, b, c, d),
  fulfilled: (a,b,c,d) => console.log("fulfilled...!", a, b, c, d),
  rejected: () => console.log("rejected..."),
})

v1.define("var_1", [], () => {
  console.log("I'm variable one!")
  return 420;
})

console.log(v1)

console.log(Object.keys(v1))
