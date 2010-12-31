var fs = require('fs'),
    Parser = require('./jsonparse');


var json = fs.readFileSync("samplejson/basic.json");

// Make sure it's parsing correctly before any benchmarking is done
var t = new Parser();
var v;
t.onValue(function (value) { v = value; });
t.write(json);
if (JSON.stringify(v) !== json) {
  throw new Error("Invalid parse result:\n" + JSON.stringify(v));
}

while (true) {
  var start = Date.now();
  for (var i = 0; i < 300; i++) {
    JSON.parse(json);
  }
  var first = Date.now() - start;
  console.log("JSON.parse took %s", first);

  start = Date.now();
  var p = new Parser();
  for (var i = 0; i < 300; i++) {
    p.write(json);
  }
  var second = Date.now() - start;
  console.log("streaming parser took %s", second);
  console.log("streaming is %s times slower", second / first);
}
