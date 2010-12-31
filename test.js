var Tokenizer = require('./jsonparse').Tokenizer;

var t = new Tokenizer();
t.write(new Buffer("123false1.3true{}[]"));
t.write(new Buffer("truefalsenullnulltruefalse"));
t.write(new Buffer("tru"));
t.write(new Buffer("efa"));
t.write(new Buffer("lse"));
t.write(new Buffer(JSON.stringify({"Hello":"World"})));
