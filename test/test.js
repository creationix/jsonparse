var test = require('tape');

var Parser = require('../');
var json = require('../samplejson/basic.json');
var jsonString = JSON.stringify(json);

var p = new Parser();
p.onValue = function (value) {
  var keys = this.stack
    .slice(1)
    .map(function (item) { return item.key })
    .concat(this.key !== undefined ? this.key : [])
  ;
  console.dir([ keys, value ]);
};

p.write('"""Hello""This\\"is""\\r\\n\\f\\t\\\\\\/\\""');
p.write('"\\u039b\\u03ac\\u03bc\\u03b2\\u03b4\\u03b1"');
p.write('"\\\\"');
p.write('"\\/"');
p.write('"\\""');
p.write('[0,1,-1]');
p.write('[1.0,1.1,-1.1,-1.0][-1][-0.1]');
p.write('[6.02e23]');
