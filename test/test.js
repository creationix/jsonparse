var Parser = require('../');
var json = require('../samplejson/basic.json');
var jsonString = JSON.stringify(json);

var t = new Parser();
var v;
t.onValue = function (value) { v = value; };
t.write(jsonString);

var p = new Parser();
p.onValue = function (value) {
  var keys = this.stack.map(function (item) {
    return '.' + item.key;
  }, this);
  keys.push('.' + this.key);
  keys.shift();
  var o = JSON.stringify(value) || "";
  if (o.length > 80) {
    o = o.substr(0, 77) + "...";
  }
  console.log("value%s = %s", keys.join(''), o);
};

p.write('"""Hello""This\\"is""\\r\\n\\f\\t\\\\\\/\\""');
p.write('"\\u039b\\u03ac\\u03bc\\u03b2\\u03b4\\u03b1"');
p.write('"\\\\"');
p.write('"\\/"');
p.write('"\\""');
p.write('[0,1,-1]');
p.write('[1.0,1.1,-1.1,-1.0][-1][-0.1]');
p.write('[6.02e23]');
