const fs = require('fs');
const [content, file] = process.argv.slice(2, 4);
fs.writeFileSync(file, content, "utf8");