
const { readFileSync } = require("fs");
const ins = process.argv.slice(2);
ins.map(inp => process.stdout.write(readFileSync(inp)));
process.stdout.write("C2");
