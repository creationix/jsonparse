var stream = require('stream');
var JsonParse = require('../jsonparse');
var test = require('tape');

test('can handle large tokens without running out of memory', function (t) {
  var size = 1024 * 1024 * 200; // 200mb
  t.plan(1);
  largeJsonStream(size).pipe(parseStream(function (type, value) {
    t.equal(value.length, size, 'token should be size of input json');
    t.end();
  }));
});

function largeJsonStream (size, options) {
  var jsonStrream = new stream.Readable(options);
  var sent = 0;

  jsonStrream.push('"');

  jsonStrream._read = function (readSize) {
    var bytesToSend = Math.min(readSize, size - sent);
    jsonStrream.push(Buffer.alloc(bytesToSend, 'a'));
    sent += bytesToSend;
    if (sent >= size) {
      jsonStrream.push('"');
      jsonStrream.push(null);
    }
  };

  return jsonStrream;
}

function parseStream (onToken, options) {
  var parseStream = new stream.Writable(options);
  var parser = new JsonParse();

  parser.onToken = onToken;

  parseStream._write = function (chunk, encoding, cb) {
    parser.write(chunk);
    cb();
  };

  return parseStream;
}
