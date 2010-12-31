var fs = require('fs'),
    Parser = require('./jsonparse').Parser;


var json = fs.readFileSync("samplejson/basic.json");
console.dir(JSON.parse(json));
var p = new Parser();
p.onValue = function (value) {
  console.dir(value);
};
p.write(json);
