/*global Buffer*/
var Tokenizer = require('./jsonparse').Tokenizer,
    Parser    = require('./jsonparse').Parser;
/*
var t = new Tokenizer();
t.onToken = function (token, value) {
  console.log("%s %s", token, value);
}
t.write(new Buffer("123false1.3true{}[]"));
t.write(new Buffer("truefalsenullnulltruefalse"));
t.write(new Buffer("tru"));
t.write(new Buffer("efa"));
t.write(new Buffer("lse"));
t.write(new Buffer(JSON.stringify({"Hello":"World"})));
*/
var p = new Parser();
p.tokenizer.syntaxError = function (buffer, i) {
  console.dir({n:buffer[i],t:this,a:arguments});
  throw new Error("Syntax Error in Tokenizer");
};
p.syntaxError = function (token, value) {
  console.dir({t:this,token:token,value:value});
  throw new Error("Syntax Error in Parser");
};
p.onValue = function (value) {
  if (!this.stack.length) {
    console.log("VALUE: %s", JSON.stringify(value));
  }
};
p.write('{"name": "Tim", "age": 28}');
/*
p.write(new Buffer("123false1.3true{}[]"));
p.write(new Buffer('{ "name": "Tim", "age": 28 }'));
p.write(new Buffer('{\n\t"name": "Tim",\n\t"age": 28\n}'));
p.write(new Buffer('{\r\n\t"name": "Tim",\r\n\t"age": 28\r\n}'));
p.write(new Buffer("truefalsenullnulltruefalse"));
p.write(new Buffer("tru"));
p.write(new Buffer("efa"));
p.write(new Buffer("lse"));
p.write(new Buffer(JSON.stringify({"Hello":"World"})));
*/
