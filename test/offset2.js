var test = require('tape');
var Parser = require('../');

var input = '{\n  "string": "value\\nwith\\nnewline", "and": "\\u039b" }';

var offsets = [
  [ 0, Parser.C.LEFT_BRACE ],
  [ 4, Parser.C.STRING ],
  [ 12, Parser.C.COLON ],
  [ 14, Parser.C.STRING ],
  [ 36, Parser.C.COMMA ],
  [ 38, Parser.C.STRING ],
  [ 43, Parser.C.COLON ],
  [ 45, Parser.C.STRING ],
  [ 55, Parser.C.RIGHT_BRACE ]
];

test('offset 2', function(t) {
  t.plan(offsets.length * 2 + 1);

  var p = new Parser();
  var i = 0;
  p.onToken = function (token) {
    t.equal(p.offset, offsets[i][0]);
    t.equal(token, offsets[i][1]);
    i++;
  };

  p.write(input);

  t.equal(i, offsets.length);
});
