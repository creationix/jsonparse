var test = require('tape');
var Parser = require('../');

['-', '1e', '1e+', '1..2'].forEach(function (text) {
  test('invalid number ' + text + ' calls onError', function (t) {
    var p = new Parser();
    var errors = [];
    var values = [];
    p.onError = function (err) { errors.push(err); };
    p.onValue = function (value) { values.push(value); };

    t.doesNotThrow(function () { p.write('[' + text + ',2]'); });
    t.equal(errors.length, 1);
    t.ok(errors[0] instanceof Error);
    t.ok(errors[0] && /Unexpected NUMBER/.test(errors[0].message));
    t.ok(errors[0] && errors[0].message.indexOf(JSON.stringify(text)) !== -1);
    t.deepEqual(values, []);
    t.end();
  });
});

test('invalid numbers throw a parse error by default', function (t) {
  var p = new Parser();
  t.throws(function () { p.write('[1e,2]'); }, /Unexpected NUMBER/);
  t.end();
});

test('invalid numbers split across chunks stop further values', function (t) {
  var p = new Parser();
  var errors = [];
  var values = [];
  p.onError = function (err) { errors.push(err); };
  p.onValue = function (value) { values.push(value); };

  p.write('[0,1');
  p.write('e');
  t.doesNotThrow(function () { p.write(',2]'); });
  t.doesNotThrow(function () { p.write('[3]'); });
  t.equal(errors.length, 1);
  t.deepEqual(values, [0]);
  t.end();
});

test('custom number revivers can handle invalid numeric text', function (t) {
  var p = new Parser();
  var values = [];
  p.numberReviver = function (text) {
    this.onToken(Parser.C.STRING, 'revived:' + text);
  };
  p.onValue = function (value) {
    if (this.stack.length === 0) values.push(value);
  };

  p.write('[1e,2]');
  t.deepEqual(values, [['revived:1e', 'revived:2']]);
  t.end();
});

test('valid numeric tokens retain their values across chunks', function (t) {
  var p = new Parser();
  var values = [];
  p.onValue = function (value) {
    if (this.stack.length === 0) values.push(value);
  };

  p.write('[0,-1,1.5,1');
  p.write('e3,7161093205057351174]');
  t.deepEqual(values, [[0, -1, 1.5, 1000, '7161093205057351174']]);
  t.end();
});
