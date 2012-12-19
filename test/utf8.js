var test = require('tape');
var Parser = require('../');

test('utf8', function (t) {
  t.plan(1);

  var p = new Parser();
  p.onValue = function (value) {
    t.equal(value, '├──');
  };

  p.write('"├──"');
});
