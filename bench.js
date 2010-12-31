var fs = require('fs'),
    Parser = require('./jsonparse');


var json = fs.readFileSync("samplejson/basic.json");
var start = Date.now();
for (var i = 0; i < 1000; i++) {
  JSON.parse(json);
}
console.log("JSON.parse took %s", Date.now() - start);

start = Date.now();
var p = new Parser();
for (var i = 0; i < 1000; i++) {
  p.write(json);
}
console.log("streaming parser took %s", Date.now() - start);
