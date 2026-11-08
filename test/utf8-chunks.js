var test = require('tape');
var Parser = require('../');

function parseChunks(chunks) {
  var parser = new Parser();
  var values = [];
  var errors = [];
  parser.onValue = function(value) {
    if (this.stack.length === 0) values.push(value);
  };
  parser.onError = function(error) { errors.push(error.message); };
  for (var i = 0; i < chunks.length; i++) parser.write(chunks[i]);
  return { values: values, errors: errors };
}

test('#41: UTF-8 characters survive every division into chunks', function(t) {
  var characters = ['\u00e9', '\u201d', '\u6211', '\ud841\udf0e'];
  for (var c = 0; c < characters.length; c++) {
    var bytes = new Buffer(characters[c]);
    for (var mask = 0; mask < (1 << (bytes.length - 1)); mask++) {
      var chunks = [new Buffer('["prefix')];
      var start = 0;
      for (var offset = 1; offset < bytes.length; offset++) {
        if (mask & (1 << (offset - 1))) {
          chunks.push(bytes.slice(start, offset));
          chunks.push(new Buffer(0));
          start = offset;
        }
      }
      chunks.push(bytes.slice(start));
      chunks.push(new Buffer('suffix",true]'));
      var parsed = parseChunks(chunks);
      t.deepEqual(parsed.errors, [], 'no error for character ' + c + ', split ' + mask);
      t.deepEqual(parsed.values, [['prefix' + characters[c] + 'suffix', true]],
        'complete value for character ' + c + ', split ' + mask);
    }
  }
  t.end();
});

test('#41: single-byte chunks preserve keys, escaped values and consecutive documents', function(t) {
  var value = {'\u201d': '\u6211\ud841\udf0e\u00e9\\\n', values: [true, null, 42]};
  var bytes = new Buffer(JSON.stringify(value) + JSON.stringify(['\u201d', 1]));
  var chunks = [];
  for (var i = 0; i < bytes.length; i++) chunks.push(bytes.slice(i, i + 1));
  var parsed = parseChunks(chunks);
  t.deepEqual(parsed.errors, []);
  t.deepEqual(parsed.values, [value, ['\u201d', 1]]);
  t.end();
});

test('#41: incomplete characters stay pending until all continuation bytes arrive', function(t) {
  var parser = new Parser();
  var values = [];
  parser.onValue = function(value) { values.push(value); };
  parser.write(new Buffer('"'));
  parser.write(new Buffer([0xf0]));
  parser.write(new Buffer([0xa0]));
  parser.write(new Buffer(0));
  t.deepEqual(values, [], 'no premature value');
  t.equal(parser.bytes_remaining, 2, 'two continuation bytes still needed');
  t.equal(parser.stringBufferOffset, 0, 'no incomplete UTF-8 was appended');
  t.end();
});

test('#41: split UTF-8 survives the internal string buffer boundary', function(t) {
  for (var tail = 0; tail < 4; tail++) {
    var prefix = new Array(65536 - tail + 1).join('a');
    var bytes = new Buffer('\ud841\udf0e');
    var chunks = [new Buffer('"' + prefix)];
    for (var i = 0; i < bytes.length; i++) chunks.push(bytes.slice(i, i + 1));
    chunks.push(new Buffer('end"'));
    var parsed = parseChunks(chunks);
    t.deepEqual(parsed.errors, []);
    t.deepEqual(parsed.values, [prefix + '\ud841\udf0eend']);
  }
  t.end();
});
