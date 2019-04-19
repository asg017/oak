const {Runtime} = require('@observablehq/runtime')

const runtime = new Runtime();

class CustomInspector {
  constructor(socket) {
    this.socket = socket
    console.log(`CustomInspector constructor called`)
  }

  pending() {
  
    console.log(`CustomInspector pending called`)
  }

  fulfilled(value, name) {
  
    console.log(`CustomInspector fulfilled called, ${value}|${name}`)
  }

  rejected(error, name) {
    console.log(`CustomInspector rejected called, ${error}|${name}`)
  }
}

const m = runtime.module();
const inspector = new CustomInspector()

const v_a = m.variable(inspector).define('a', 1)
const v_b = m.variable(inspector).define('b', 2)
const v_c = m.variable(inspector).define('c',['a','b'], (a,b)=>a+b)
v_b.define('b', 5)

