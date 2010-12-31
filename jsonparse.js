/*global Buffer*/
// Tokens
var LEFT_BRACE    = 0x7b,
    RIGHT_BRACE   = 0x7d,
    LEFT_BRACKET  = 0x5b,
    RIGHT_BRACKET = 0x5d,
    COLON         = 0x3a,
    COMMA         = 0x2c,
    TRUE          = 0x101,
    FALSE         = 0x102,
    NULL          = 0x103,
    STRING        = 0x201, // Requires value
    NUMBER        = 0x202; // Requires value

// States (Star means this could also be the start of another production)
var START = 0x00,
    TRUE1 = 0x11, TRUE2 = 0x12, TRUE3 = 0x13,
    FALSE1 = 0x21, FALSE2 = 0x22, FALSE3 = 0x23, FALSE4 = 0x24,
    NULL1 = 0x31, NULL2 = 0x32, NULL3 = 0x33,
    NUMBER1 = 0x41, // After minus
    NUMBER2 = 0x42, // * after initial zero
    NUMBER3 = 0x43, // * after digit (before period)
    NUMBER4 = 0x44, // after period
    NUMBER5 = 0x45, // * after digit (after period)
    NUMBER6 = 0x46, // after E
    NUMBER7 = 0x47, // after +/-
    NUMBER8 = 0x48, // * after digit after +/-
    STRING1 = 0x51, // After open quote
    STRING2 = 0x52, // After backslash
    STRING3 = 0x53, // First unicode char
    STRING4 = 0x54, // Second unicode char
    STRING5 = 0x55, // Third unicode char
    STRING6 = 0x56; // Fourth unicode char

// Events
// startObject, endObject
// startArray, endArray
//
function Tokenizer() {
  this.state = START;
  this.data = [];
}
Tokenizer.prototype.write = function (buffer) {
  // TODO: Don't require this conversion to accept strings
  // It's probably quite expensive
  if (typeof buffer === 'string') {
    buffer = new Buffer(buffer);
  }
  process.stdout.write("Input: ");
  console.dir(buffer.toString());
  var n;
  for (var i = 0, l = buffer.length; i < l; i++) {
    switch (this.state) {
    case START:
      n = buffer[i];
      switch (n) {
      case LEFT_BRACE: this.emit(LEFT_BRACE); break;
      case RIGHT_BRACE: this.emit(RIGHT_BRACE); break;
      case LEFT_BRACKET: this.emit(LEFT_BRACKET); break;
      case RIGHT_BRACKET: this.emit(RIGHT_BRACKET); break;
      case COLON: this.emit(COLON); break;
      case COMMA: this.emit(COMMA); break;
      case 0x74: this.state = TRUE1; break; // t
      case 0x66: this.state = FALSE1; break; // f
      case 0x6e: this.state = NULL1; break; // n
      case 0x22: this.data.push(n); this.state = STRING1; break; // "
      case 0x2d: this.data.push(n); this.state = NUMBER1; break; // -
      case 0x30: this.data.push(n); this.state = NUMBER2; break; // 0
      default:
        if (n > 0x30 && n < 0x40) { // 1-9
          this.data.push(n); this.state = NUMBER3;
        } else if (n === 0x20 || n === 0x09 || n === 0x0a || n === 0x0d) {
          // whitespace
        } else { this.syntaxError(buffer, i); }
        break;
      }
      break;
    case STRING1: // After open quote
      n = buffer[i];
      // TODO: Handle native utf8 characters, this code assumes ASCII input
      if (n === 0x22) { this.data.push(n); this.state = START; this.emit(STRING); }
      else if (n === 0x5c) { this.data.push(n); this.state = STRING2; }
      else { this.data.push(n); }
      break;
    case STRING2: // After backslash
      n = buffer[i];
      switch (n) {
      case 0x22: case 0x5c: case 0x2f: case 0x62: case 0x66: case 0x6e: case 0x72: case 0x74: // "\/bfnrt
        this.data.push(n); this.state = STRING1; break;
      case 0x75: this.data.push(n); this.state = STRING3; break;
      default: this.syntaxError(buffer, i); break;
      }
      break;
    case STRING3: case STRING4: case STRING4: case STRING6: // unicode hex codes
      n = buffer[i];
      // 0-9 A-F a-f
      if ((n >= 0x30 && n < 0x40) || (n > 0x40 && n <= 0x46) || (n > 0x60 && n <= 0x66)) {
        this.data.push(n);
        if (this.state++ === STRING6) { this.state = STRING1; }
      } else {
        this.syntaxError(buffer, i);
      }
      break;
    case NUMBER1: // after minus
      n = buffer[i];
      if (n === 0x30) { this.data.push(n); this.state = NUMBER2; }
      else if (n > 0x30 && n < 0x40) { this.data.push(n); this.state = NUMBER3; }
      else { this.syntaxError(buffer, i); }
      break;
    case NUMBER2: // * After initial zero
      switch (buffer[i]) {
      case 0x2e: this.data.push(0x2e); this.state = NUMBER4; break; // .
      case 0x65: this.data.push(0x65); this.state = NUMBER6; break; // e
      case 0x45: this.data.push(0x45); this.state = NUMBER6; break; // E
      default: this.state = START; this.emit(NUMBER); i--; break;
      }
      break;
    case NUMBER3: // * After digit (before period)
      n = buffer[i];
      switch (n) {
      case 0x2e: this.data.push(0x2e); this.state = NUMBER4; break; // .
      case 0x65: this.data.push(0x65); this.state = NUMBER6; break; // e
      case 0x45: this.data.push(0x45); this.state = NUMBER6; break; // E
      default: 
        if (n >= 0x30 && n < 0x40) { this.data.push(n); }
        else {this.state = START; this.emit(NUMBER); i--; break; }
      }
      break;
    case NUMBER4: // After period
      n = buffer[i];
      if (n >= 0x30 && n < 0x40) { this.data.push(n); this.state = NUMBER5; } // 0-9
      else { this.syntaxError(buffer, i); }
      break;
    case NUMBER5: // * After digit (after period)
      n = buffer[i];
      if (n >= 0x30 && n < 0x40) { this.data.push(n); } // 0-9
      else if (n === 0x65 || n === 0x45) { this.data.push(n); this.state = NUMBER6; } // E/e
      else { this.state = START; this.emit(NUMBER); i--; }
      break;
    case NUMBER6: // After E
      n = buffer[i];
      if (n === 0x2b || n === 0x2d) { this.data.push(n); this.state = NUMBER7; } // +/-
      else if (n >= 0x30 && n < 0x40) { this.data.push(n); this.state = NUMBER8; } // 0-9  
      else { this.syntaxError(buffer, i); }  
      break;
    case NUMBER7: // After +/-
      n = buffer[i];
      if (n >= 0x30 && n < 0x40) { this.data.push(n); this.state = NUMBER8; } // 0-9
      else { this.syntaxError(buffer, i); }  
      break;
    case NUMBER8: // * After digit (after +/-)
      n = buffer[i];
      if (n >= 0x30 && n < 0x40) { this.data.push(n); this.state = NUMBER8; } // 0-9
      else { this.state = START; this.emit(NUMBER); i--; }  
      break;
    case TRUE1: // r
      if (buffer[i] === 0x72) { this.state = TRUE2; }
      else { this.syntaxError(buffer, i); }
      break;
    case TRUE2: // u
      if (buffer[i] === 0x75) { this.state = TRUE3; }
      else { this.syntaxError(buffer, i); }
      break;
    case TRUE3: // e
      if (buffer[i] === 0x65) { this.state = START; this.emit(TRUE); }
      else { this.syntaxError(buffer, i); }
      break;
    case FALSE1: // a
      if (buffer[i] === 0x61) { this.state = FALSE2; }
      else { this.syntaxError(buffer, i); }
      break;
    case FALSE2: // l
      if (buffer[i] === 0x6c) { this.state = FALSE3; }
      else { this.syntaxError(buffer, i); }
      break;
    case FALSE3: // s
      if (buffer[i] === 0x73) { this.state = FALSE4; }
      else { this.syntaxError(buffer, i); }
      break;
    case FALSE4: // e
      if (buffer[i] === 0x65) { this.state = START; this.emit(FALSE); }
      else { this.syntaxError(buffer, i); }
      break;
    case NULL1: // u
      if (buffer[i] === 0x75) { this.state = NULL2; }
      else { this.syntaxError(buffer, i); }
      break;
    case NULL2: // l
      if (buffer[i] === 0x6c) { this.state = NULL3; }
      else { this.syntaxError(buffer, i); }
      break;
    case NULL3: // l
      if (buffer[i] === 0x6c) { this.state = START; this.emit(NULL); }
      else { this.syntaxError(buffer, i); }
      break;
    }
  }
};
Tokenizer.prototype.emit = function (token) {
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
Tokenizer.prototype.onToken = function (token, value) {
  // Override this to get events
};

var VALUE = 0,
    KEY = 1;

function Parser(tokenizer) {
  var t = this.tokenizer = tokenizer || new Tokenizer();
  t.onToken = this.onToken.bind(this);
  this.write = t.write.bind(t);

  this.value = undefined;
  this.key = undefined;
  this.mode = undefined;
  this.stack = [];
  this.state = VALUE;
}
Parser.prototype.push = function () {
  this.stack.push({value: this.value, key: this.key, mode: this.mode});
};
Parser.prototype.pop = function () {
  var value = this.value;
  var parent = this.stack.pop();
  this.value = parent.value;
  this.key = parent.key;
  this.mode = parent.mode;
  this.emit(value);
};
Parser.prototype.emit = function (value) {
  if (this.mode) { this.state = COMMA; }
  this.onValue(value);
};
Parser.prototype.onValue = function (value) {
  // Override me
};  
Parser.prototype.onToken = function (token, value) {
  console.log("OnToken: state=%s token=%s value=%s", this.state, token, value);
  switch (this.state) {
  case START:
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
      this.mode = KEY;
      break;
    case LEFT_BRACKET:
      this.push();
      if (this.value) {
        this.value = this.value[this.key] = [];
      } else {
        this.value = [];
      }
      this.key = 0;
      this.mode = VALUE;
      break;
    case RIGHT_BRACE:
      if (this.mode === KEY) {
        this.pop();
      } else {
        this.syntaxError(token, value);
      }
      break;
    case RIGHT_BRACKET:
      if (this.mode === VALUE) {
        this.pop();
      } else {
        this.syntaxError(token, value);
      }
      break;
    default:
      this.syntaxError(token, value); break;
    }
    break;
  case KEY:
    if (token === STRING) {
      this.key = value;
      this.state = COLON;
    } else {
      this.syntaxError(token, value);
    }
    break;
  case COLON:
    if (token === COLON) { this.state = VALUE; }
    else { this.syntaxError(token, value); }
    break;
  case COMMA:
    if (token === COMMA) { 
      if (this.MODE === VALUE) { this.key++; }
      this.state = this.mode;
    } else if (token === RIGHT_BRACE && this.mode === KEY || token === RIGHT_BRACKET && this.mode !==KEY) {
      this.pop();
    } else {
      this.syntaxError(token, value);
    }
    break;
  default:
    this.syntaxError(token, value);
  }
};


exports.Tokenizer = Tokenizer;
exports.Parser = Parser;
