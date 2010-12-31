/*global Buffer*/
// Named constants with unique integer values
var C = {}, uniq = 0;
// Tokens
var LEFT_BRACE    = C.LEFT_BRACE    = uniq++;
var RIGHT_BRACE   = C.RIGHT_BRACE   = uniq++;
var LEFT_BRACKET  = C.LEFT_BRACKET  = uniq++;
var RIGHT_BRACKET = C.RIGHT_BRACKET = uniq++;
var COLON         = C.COLON         = uniq++;
var COMMA         = C.COMMA         = uniq++;
var TRUE          = C.TRUE          = uniq++;
var FALSE         = C.FALSE         = uniq++;
var NULL          = C.NULL          = uniq++;
var STRING        = C.STRING        = uniq++;
var NUMBER        = C.NUMBER        = uniq++;
// Tokenizer States
var START   = C.START   = uniq++;
var TRUE1   = C.TRUE1   = uniq++;
var TRUE2   = C.TRUE2   = uniq++;
var TRUE3   = C.TRUE3   = uniq++;
var FALSE1  = C.FALSE1  = uniq++;
var FALSE2  = C.FALSE2  = uniq++;
var FALSE3  = C.FALSE3  = uniq++;
var FALSE4  = C.FALSE4  = uniq++;
var NULL1   = C.NULL1   = uniq++;
var NULL2   = C.NULL3   = uniq++;
var NULL3   = C.NULL2   = uniq++;
var NUMBER1 = C.NUMBER1 = uniq++;
var NUMBER2 = C.NUMBER2 = uniq++;
var NUMBER3 = C.NUMBER3 = uniq++;
var NUMBER4 = C.NUMBER4 = uniq++;
var NUMBER5 = C.NUMBER5 = uniq++;
var NUMBER6 = C.NUMBER6 = uniq++;
var NUMBER7 = C.NUMBER7 = uniq++;
var NUMBER8 = C.NUMBER8 = uniq++;
var STRING1 = C.STRING1 = uniq++;
var STRING2 = C.STRING2 = uniq++;
var STRING3 = C.STRING3 = uniq++;
var STRING4 = C.STRING4 = uniq++;
var STRING5 = C.STRING5 = uniq++;
var STRING6 = C.STRING6 = uniq++;
// Parser States
var VALUE   = C.VALUE   = uniq++;
var KEY     = C.KEY     = uniq++;
//  COMMA
// Parser Modes
var OBJECT  = C.OBJECT  = uniq++;
var ARRAY   = C.ARRAY   = uniq++;

function toknam(code) {
  var keys = Object.keys(C);
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    if (C[key] === code) { return key; }
  }
  return code && ("0x" + code.toString(16));
}


function Parser() {
  this.tState = START;
  this.data = [];
  this.value = undefined;
  this.key = undefined;
  this.mode = undefined;
  this.stack = [];
  this.state = VALUE;
}
var proto = Parser.prototype;
proto.charError = function (buffer, i) {
  this.onError(new Error("Unexpected " + JSON.stringify(String.fromCharCode(buffer[i])) + " at position " + i + " in state " + toknam(this.tState)));
};
proto.onError = function (err) { throw err; };
proto.write = function (buffer) {
  // TODO: Don't require this conversion to accept strings
  // It's probably quite expensive
  if (typeof buffer === 'string') {
    buffer = new Buffer(buffer);
  }
  //process.stdout.write("Input: ");
  //console.dir(buffer.toString());
  var n;
  for (var i = 0, l = buffer.length; i < l; i++) {
    switch (this.tState) {
    case START:
      n = buffer[i];
      switch (n) {
      case 0x7b: this.emitToken(LEFT_BRACE); break; // {
      case 0x7d: this.emitToken(RIGHT_BRACE); break; // }
      case 0x5b: this.emitToken(LEFT_BRACKET); break; // [
      case 0x5d: this.emitToken(RIGHT_BRACKET); break; // ]
      case 0x3a: this.emitToken(COLON); break; // :
      case 0x2c: this.emitToken(COMMA); break; // ,
      case 0x74: this.tState = TRUE1; break; // t
      case 0x66: this.tState = FALSE1; break; // f
      case 0x6e: this.tState = NULL1; break; // n
      case 0x22: this.data.push(n); this.tState = STRING1; break; // "
      case 0x2d: this.data.push(n); this.tState = NUMBER1; break; // -
      case 0x30: this.data.push(n); this.tState = NUMBER2; break; // 0
      default:
        if (n > 0x30 && n < 0x40) { // 1-9
          this.data.push(n); this.tState = NUMBER3;
        } else if (n === 0x20 || n === 0x09 || n === 0x0a || n === 0x0d) {
          // whitespace
        } else { this.charError(buffer, i); }
        break;
      }
      break;
    case STRING1: // After open quote
      n = buffer[i];
      // TODO: Handle native utf8 characters, this code assumes ASCII input
      if (n === 0x22) { this.data.push(n); this.tState = START; this.emitToken(STRING); }
      else if (n === 0x5c) { this.data.push(n); this.tState = STRING2; }
      else { this.data.push(n); }
      break;
    case STRING2: // After backslash
      n = buffer[i];
      switch (n) {
      case 0x22: case 0x5c: case 0x2f: case 0x62: case 0x66: case 0x6e: case 0x72: case 0x74: // "\/bfnrt
        this.data.push(n); this.tState = STRING1; break;
      case 0x75: this.data.push(n); this.tState = STRING3; break;
      default: this.charError(buffer, i); break;
      }
      break;
    case STRING3: case STRING4: case STRING4: case STRING6: // unicode hex codes
      n = buffer[i];
      // 0-9 A-F a-f
      if ((n >= 0x30 && n < 0x40) || (n > 0x40 && n <= 0x46) || (n > 0x60 && n <= 0x66)) {
        this.data.push(n);
        if (this.tState++ === STRING6) { this.tState = STRING1; }
      } else {
        this.charError(buffer, i);
      }
      break;
    case NUMBER1: // after minus
      n = buffer[i];
      if (n === 0x30) { this.data.push(n); this.tState = NUMBER2; }
      else if (n > 0x30 && n < 0x40) { this.data.push(n); this.tState = NUMBER3; }
      else { this.charError(buffer, i); }
      break;
    case NUMBER2: // * After initial zero
      switch (buffer[i]) {
      case 0x2e: this.data.push(0x2e); this.tState = NUMBER4; break; // .
      case 0x65: this.data.push(0x65); this.tState = NUMBER6; break; // e
      case 0x45: this.data.push(0x45); this.tState = NUMBER6; break; // E
      default: this.tState = START; this.emitToken(NUMBER); i--; break;
      }
      break;
    case NUMBER3: // * After digit (before period)
      n = buffer[i];
      switch (n) {
      case 0x2e: this.data.push(0x2e); this.tState = NUMBER4; break; // .
      case 0x65: this.data.push(0x65); this.tState = NUMBER6; break; // e
      case 0x45: this.data.push(0x45); this.tState = NUMBER6; break; // E
      default: 
        if (n >= 0x30 && n < 0x40) { this.data.push(n); }
        else {this.tState = START; this.emitToken(NUMBER); i--; break; }
      }
      break;
    case NUMBER4: // After period
      n = buffer[i];
      if (n >= 0x30 && n < 0x40) { this.data.push(n); this.tState = NUMBER5; } // 0-9
      else { this.charError(buffer, i); }
      break;
    case NUMBER5: // * After digit (after period)
      n = buffer[i];
      if (n >= 0x30 && n < 0x40) { this.data.push(n); } // 0-9
      else if (n === 0x65 || n === 0x45) { this.data.push(n); this.tState = NUMBER6; } // E/e
      else { this.tState = START; this.emitToken(NUMBER); i--; }
      break;
    case NUMBER6: // After E
      n = buffer[i];
      if (n === 0x2b || n === 0x2d) { this.data.push(n); this.tState = NUMBER7; } // +/-
      else if (n >= 0x30 && n < 0x40) { this.data.push(n); this.tState = NUMBER8; } // 0-9  
      else { this.charError(buffer, i); }  
      break;
    case NUMBER7: // After +/-
      n = buffer[i];
      if (n >= 0x30 && n < 0x40) { this.data.push(n); this.tState = NUMBER8; } // 0-9
      else { this.charError(buffer, i); }  
      break;
    case NUMBER8: // * After digit (after +/-)
      n = buffer[i];
      if (n >= 0x30 && n < 0x40) { this.data.push(n); this.tState = NUMBER8; } // 0-9
      else { this.tState = START; this.emitToken(NUMBER); i--; }  
      break;
    case TRUE1: // r
      if (buffer[i] === 0x72) { this.tState = TRUE2; }
      else { this.charError(buffer, i); }
      break;
    case TRUE2: // u
      if (buffer[i] === 0x75) { this.tState = TRUE3; }
      else { this.charError(buffer, i); }
      break;
    case TRUE3: // e
      if (buffer[i] === 0x65) { this.tState = START; this.emitToken(TRUE); }
      else { this.charError(buffer, i); }
      break;
    case FALSE1: // a
      if (buffer[i] === 0x61) { this.tState = FALSE2; }
      else { this.charError(buffer, i); }
      break;
    case FALSE2: // l
      if (buffer[i] === 0x6c) { this.tState = FALSE3; }
      else { this.charError(buffer, i); }
      break;
    case FALSE3: // s
      if (buffer[i] === 0x73) { this.tState = FALSE4; }
      else { this.charError(buffer, i); }
      break;
    case FALSE4: // e
      if (buffer[i] === 0x65) { this.tState = START; this.emitToken(FALSE); }
      else { this.charError(buffer, i); }
      break;
    case NULL1: // u
      if (buffer[i] === 0x75) { this.tState = NULL2; }
      else { this.charError(buffer, i); }
      break;
    case NULL2: // l
      if (buffer[i] === 0x6c) { this.tState = NULL3; }
      else { this.charError(buffer, i); }
      break;
    case NULL3: // l
      if (buffer[i] === 0x6c) { this.tState = START; this.emitToken(NULL); }
      else { this.charError(buffer, i); }
      break;
    }
  }
};
proto.emitToken = function (token) {
  var value;
  if (this.data.length) {
    value = JSON.parse(new Buffer(this.data).toString());
    this.data.length = 0;
  }
  else if (token === TRUE) { value = true; }
  else if (token === FALSE) { value = false; }
  else if (token === NULL) { value = null; }
  this.onToken(token, value);
};
proto.onToken = function (token, value) {
  // Override this to get events
};

proto.parseError = function (token, value) {
  this.onError(new Error("Unexpected " + toknam(token) + (value ? ("(" + JSON.stringify(value) + ")") : "") + " in state " + toknam(this.state)));
};
proto.onError = function (err) { throw err; };
proto.push = function () {
  this.stack.push({value: this.value, key: this.key, mode: this.mode});
};
proto.pop = function () {
  var value = this.value;
  var parent = this.stack.pop();
  this.value = parent.value;
  this.key = parent.key;
  this.mode = parent.mode;
  this.emit(value);
  if (!this.mode) { this.state = VALUE; }
};
proto.emit = function (value) {
  if (this.mode) { this.state = COMMA; }
  this.onValue(value);
};
proto.onValue = function (value) {
  // Override me
};  
proto.onToken = function (token, value) {
  //console.log("OnToken: state=%s token=%s %s", toknam(this.state), toknam(token), value?JSON.stringify(value):"");
  switch (this.state) {
  case VALUE:
    switch (token) {
    case STRING: case NUMBER: case TRUE: case FALSE: case NULL:
      if (this.value) {
        this.value[this.key] = value;
      }
      this.emit(value);
    break;  
    case LEFT_BRACE:
      this.push();
      if (this.value) {
        this.value = this.value[this.key] = {};
      } else {
        this.value = {};
      }
      this.key = undefined;
      this.state = KEY;
      this.mode = OBJECT;
      break;
    case LEFT_BRACKET:
      this.push();
      if (this.value) {
        this.value = this.value[this.key] = [];
      } else {
        this.value = [];
      }
      this.key = 0;
      this.mode = ARRAY;
      this.state = VALUE;
      break;
    case RIGHT_BRACE:
      if (this.mode === OBJECT) {
        this.pop();
      } else {
        this.parseError(token, value);
      }
      break;
    case RIGHT_BRACKET:
      if (this.mode === ARRAY) {
        this.pop();
      } else {
        this.parseError(token, value);
      }
      break;
    default:
      this.parseError(token, value); break;
    }
    break;
  case KEY:
    if (token === STRING) {
      this.key = value;
      this.state = COLON;
    } else if (token === RIGHT_BRACE) {
      this.pop();
    } else {
      this.parseError(token, value);
    }
    break;
  case COLON:
    if (token === COLON) { this.state = VALUE; }
    else { this.parseError(token, value); }
    break;
  case COMMA:
    if (token === COMMA) { 
      if (this.mode === ARRAY) { this.key++; this.state = VALUE; }
      else if (this.mode === OBJECT) { this.state = KEY; }

    } else if (token === RIGHT_BRACKET && this.mode === ARRAY || token === RIGHT_BRACE && this.mode === OBJECT) {
      this.pop();
    } else {
      this.parseError(token, value);
    }
    break;
  default:
    this.parseError(token, value);
  }
};


module.exports = Parser;
