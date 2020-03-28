const fs = require("fs");
const path = require("path");

const outputDir = process.argv[2];
const numFiles = process.argv[3];
const contentPrefix = process.argv[4];

if(!fs.existsSync(outputDir))
  fs.mkdirSync(outputDir);

console.log(`generating ${numFiles} files inside ${outputDir} ...`);
for (let i = 0; i < numFiles; i++) {
  fs.writeFileSync(path.join(outputDir, `file${i}`), `${contentPrefix}${i}`);
}
