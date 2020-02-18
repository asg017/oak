const fs = require("fs");
const path = require("path");

const outputDir = process.argv[2];
const numFiles = process.argv[3];
const content = process.argv[4];

console.log(`generating ${numFiles} files inside ${outputDir} ...`);
for (let i = 0; i < numFiles; i++) {
  fs.writeFileSync(path.join(outputDir, `file${i}`), content);
}
