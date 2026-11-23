var test = require('tape');
var Parser = require('../');

test('number at the end of the input', function (t) {
  t.plan(1);

  var p = new Parser();
  p.onValue = function (value) {
    t.equal(value, 1);
  };

  p.write('1');
  p.end();
});

test('input that ends inside a value', function (t) {
  t.plan(1);

  var p = new Parser();
  p.onError = function (err) {
    t.equal(err.message, 'Unexpected end of input');
  };

  p.write('[1');
  p.end();
});
