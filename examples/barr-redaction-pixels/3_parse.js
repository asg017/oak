var fs = require("fs");

var reports = fs.readdirSync("histograms");

var headers = new Set();
var rows = [];

reports.forEach(function(filename) {
  var report = fs.readFileSync("histograms/" + filename, "utf-8");
  var lines = report.split("\n").filter(l => l);
  var page = filename.replace(/[a-z\-._]/gi, "");
  var data = { filename, page };
  lines.forEach(function(line) {
    var [ all, pixels, hex, color ] = line.match(/^\s+(\d+): \([^)]+\) (#[0-9a-f]{6,8})/i);
    data[color || hex] = pixels * 1;
  });
  rows.push(data);
  for (var k in data) headers.add(k);
});

headers = Array.from(headers);

var out = fs.createWriteStream("values.csv");
out.write(headers.join(",") + "\n");
rows.forEach(function(r) {
  out.write(headers.map(h => r[h] || 0).join(",") + "\n");
});
out.end();