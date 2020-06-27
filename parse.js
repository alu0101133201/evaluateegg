/** 
 * @author Esther Jorge Paramio y Sergio Guerra Arencibia 
 * Universidad de La Laguna
 * Procesadores de lenguaje
 * @file Fichero que implementa y exporta las funciones de análisis léxico
 * y sintáctico
 * @since 15-04-20
 */

const {Value, Word, Apply} = require('./ast.js');
const XRegExp = require('xregexp');

const FS = require('fs');
const WHITES = /(\s|[#;].*|\/\*(.|\n)*?\*\/)*/y;
const STRING = /"((?:[^"\\]|\\.)*)"/y;
const NUMBER = /([-+]?\d*\.?\d+([eE][-+]?\d+)?)/y;
const WORD   = /([^\s(){}\[\],.":]+|:=)/y;
const LP     = /([(]|[{]|[\[])/y;
const RP     = /([)]|[}]|\])/y;
const COMMA  = /(,|:(?!=))/y;
const DOT    = /[.]/y;
const REGEX  = /r\/((?:[^\/\\]|\\.)*)\/(\w*?\b)?/y;


const TOKENS = [WHITES, STRING, NUMBER, WORD, LP, RP, COMMA, DOT, REGEX];
let currentDelimiters = [];

let lookahead;
let offset;
let program;
let lineno;
let result;


/**
 * @description Función que inicializa el entorno para realizar el parseo
 * @param {String} newProgram Programa que se quiere analizar 
 */
function initialize(newProgram) {
  program = newProgram;
  lineno = 1;
  offset = 0;
  result = [];
  count = 0;
}

/**
 * @description Función que analiza de manera cruda el siguiente token del código a analizar.
 * El análisis de los tokens se realiza mediante expresiones regulares y se  
 * almacena en la variable global "lookahead".  
 * No es una lectura destructiva, se utiliza el sticky bit de las expresiones 
 * regulares para su análisis
 * @return {object} Devuelve lookahead, que contiene el token leido
 */
function lex() {
  let match = null;
  let expr;
  let string = program.slice(offset);

  TOKENS.forEach((t) => { t.lastIndex = offset; });
  match = WHITES.exec(program)
  // Detectamos los espacios en blancos
  if (match[0].length > 0) {
    string = string.slice(match[0].length);
    // Contamos cuantas líneas hemos avanzado
    for (let matchIter = 0; matchIter < match[0].length; matchIter++) {
      if (match[0][matchIter] === '\n')
        lineno++;
    }
    offset += match[0].length
  }
  // Leemos el token
  if (program.length > offset) {
    TOKENS.forEach((t) => { t.lastIndex = offset; });
    if (match = STRING.exec(program)) {
      expr = {type: "STRING", value: match[1], offset: offset, line: lineno};
    } else if (match = NUMBER.exec(program)) {
      expr = {type: "NUMBER", value: Number(match[0]), offset: offset, line: lineno};
    } else if (match = REGEX.exec(program)) {
      expr = {type: "REGEX", value: XRegExp(match[1], match[2]), offset: offset, line: lineno}
    } else if (match = WORD.exec(program)) {
      expr = {type: "WORD", name: match[0], offset: offset, line: lineno};
    } else if(match = LP.exec(program)) {
      currentDelimiters.push(match[0]);
      expr = {type: "LP", value: match[0], offset: offset, line: lineno};
    } else if(match = RP.exec(program)) {
      switch(currentDelimiters[currentDelimiters.length - 1]) {
        case '(': if (match[0] !== ')')
          throw new SyntaxError(`Unexpected syntax -  Expected right parenthesis: at line ${lineno}, near: { ${errorZone} }`);
          break;
        case '{': if (match[0] !== '}')
          throw new SyntaxError(`Unexpected syntax -  Expected right curly bracket: at line ${lineno}, near: { ${errorZone} }`);
          break;
        case '[': if (match[0] !== ']')
          throw new SyntaxError(`Unexpected syntax - Expected right bracket: at line ${lineno}, near: { ${errorZone} }`);
          break;
      }
      currentDelimiters.pop();
      expr = {type: "RP", value: match[0], offset: offset, line: lineno};
    } else if(match = COMMA.exec(program)) {  
      expr = {type: "COMMA", value: match[0], offset: offset, line: lineno};
    } else if (match = DOT.exec(program)) {
      expr = {type: "DOT", value: match[1], offset: offset, line: lineno};
    } else {
      errorZone = program.slice(offset - 6, offset + 6);
      throw new SyntaxError(`Unexpected syntax: at line ${lineno}, near: { ${errorZone} }`);
    }
  }
  else {
    expr = null;
  }
  offset += match[0].length;
  lookahead = expr;
  return lookahead;
}

/**
 * @description Función que analiza una expresión del código
 * @return Devuelve el resultado de una llamada a parseApply. Esto es debido a cómo la gramática
 * está diseñada, ya que después de cada expresión puede venir una aplicación
 */
function parseExpression() {
  let expr;

  if (lookahead.type === "STRING") {
    expr = new Value(lookahead);
    makeLexer();
  } else if (lookahead.type === "NUMBER") {
    expr = new Value(lookahead);
    makeLexer();
  } else if (lookahead.type === "REGEX") {
    expr = new Value(lookahead);
    makeLexer();
  } else if (lookahead.type === "WORD") {
    expr = new Word(lookahead);
    makeLexer();
  } else {
    errorZone = program.slice(offset - 6, offset + 6);
    throw new SyntaxError(`Unexpected syntax: at line ${lineno}, near: { ${errorZone} }`);
  }
  return parseApply(expr);
}

/**
 * @description Función que analiza una aplicación del código
 * @param {object} expr Token que contiene el elemento que nombra la aplicación
 * @return Devuelve el árbol correspondiente al árbol de la aplicación o el token
 * llamante si no se encuentra una aplicación posterior a este
 */
function parseApply(expr) {
  // Caso de que no exista ninguna aplicación posterior o que directamente
  // no exista lookahead
  if (!lookahead || lookahead.type !== "LP") {
    return expr;
  }
  makeLexer();
  expr = new Apply(expr);

  // Lectura y análisis de todo el contenido de la aplicación (lo que va entre paréntesis)
  while (lookahead && lookahead.type !== "RP") {
    let arg = parseExpression();
    expr.args.push(arg);

    if (lookahead && lookahead.type === "COMMA") {
      makeLexer();
    } else if (!lookahead || lookahead.type !== "RP") {
      errorZone = program.slice(offset - 6, offset + 6);
      throw new SyntaxError(`Expected ',' or ')': at line ${lineno}, near: { ${errorZone} }`);
    }
  }
  if (!lookahead)  throw new SyntaxError(`Expected ')'  at line ${lineno}`);
  makeLexer();
  return parseApply(expr);
}

/**
 * @description Inicializa el programa y lo parsea creando el árbol sintáctico abstracto (AST)
 * @param {string} newProgram Programa Egg a parsear
 * @returns Devuelve el AST del código 
 */
function parse(newProgram) {
  initialize(newProgram);
  // lex();
  result = getTokens(program);
  makeLexer();
  let tree = parseExpression();
  if (lookahead !== null || lookahead === undefined) 
    throw new SyntaxError(`Unexpected input after reached the end of parsing`);
  return tree;
}

/**
 * @description Crea el fichero precompilado de nuestro programa egg con la extensión
 * .evm (EggVirtualMachine)
 * @param {string} file Fichero que contiene el código egg
 */
function parseFromFile(file) {
  program = FS.readFileSync(file, 'utf8');
  let tree = parse(program);
  let json = JSON.stringify(tree, null, "  ");
  file = file.slice(0, file.length - 3)
  FS.writeFileSync(file + "evm", json);
}

/**
 * @description Función que crea todos los tokens del programa y los almacena en un
 * array
 * @param {string} line Programa actual del cual queremos extraer los tokens
 * @returns {array} Array que contiene todos los tokens del programa
 */
function getTokens(line) {
  initialize(line);
  let result = [], t = null;
  do {
    try {
      t = lex();
      result.push(t);
    } catch (e) {
      result.push({ type: "ERROR", value: program});
      break;
    }
  } while(t);
  return result;
};

let nextToken;
let count = 0;
/**
 * @description Función que devuelve el siguiente token del código. Este token se obtiene de manera
 * procesada ya que ciertas funcionalidades de sintácticas se añaden en este paso. Por tanto, nuestro 
 * analizador usara makelexer() para obtener el siguiente token y makelexer cogerá los tokens (crudos) de getTokens.  
 * Todo esto se realiza mediante la construcción de una función que implementa la funcionalidad y que es llamada al 
 * final de makeLexer
 * @return Valor del siguiente token a procesar
 */
function makeLexer() {
  nextToken = function() {
    if (count < result.length) {
      lookahead = result[count++];
      if (lookahead && (lookahead.type === 'WORD') && (result[count] && result[count].value === ':')) {
        lookahead.type = 'STRING';
        lookahead.value = lookahead.name;
      }
      if (lookahead && (lookahead.type === 'DOT') && (result[count] && result[count].type === 'WORD')) {
        let word = result[count];
        let attr = {type: "STRING", value: word.name, offset: word.offset + 1, line: lookahead.lineno};
        let lp = {type: "LP", value: "(", offset: lookahead.offset, line: lookahead.lineno};
        let rp = {type: "RP", value: ")", offset: attr.offset + attr.value.length, line: attr.lineno};

        result.splice(count - 1, 2, lp, attr, rp);
        lookahead = lp;
      }
      return lookahead;
    } else {
      return null;
    } 
  } 
  return nextToken();
};

/**
 * @description Función que recorre todos los tokens y comprueba que el número de 
 * paréntesis abiertos y cerrados sea correcto, si están todos bien, devuelve 0
 * @param {string} line Programa entero
 * @returns {number} Devuelve el número de paréntesis incorrecto
 */
function parBalance(line) {
  let stack = 0;
  let tokens = getTokens(line);
  for (let token of tokens) {
    if (!token) {
      break;
    }
    if (token.type === "LP") {
      stack++
    }
    else if(token.type === "RP") {
      stack--;
    }
  }
  return stack;
}

module.exports = {
  parse,
  parseApply,
  parseExpression,
  lex,
  parseFromFile,
  getTokens,
  parBalance,
  Value,
  Word,
  Apply
}

