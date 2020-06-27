/** 
 * @author Sergio Guerra Arencibia
 * Universidad de La Laguna
 * Procesadores de lenguaje
 * @file Fichero que implementa y exporta las funciones de ejecución
 * @since 15-04-20
 */

const {
  parse,
  parseApply,
  parseExpression,
  lex,
  parseFromFile } = require("./parse.js")

const specialForms = require('./registry').specialForms;
const evaluate = require('./registry').evaluate;
const topScope = require('./registry').topScope;
const {Json2AST} = require('./json2ast.js');
const util = require('util');

const FS = require('fs');

// Definición del require
REQUIRE.cache = Object.create(null);

/**
 * @description Función que implementa la funcionalidad de incluir módulos en
 * nuestros programas egg.
 * @param {string} name Módulo que queremos incluir
 * @param {object} scope Ámbito en el que se evaluará el módulo
 * @return El elemento que será importado en nuestro programa
 */
function REQUIRE(name, scope) {
  if (name[0].value in REQUIRE.cache)
    return REQUIRE.cache[name[0].value];
  
  let code = FS.readFileSync(name[0].value, 'utf8');
  let ast = parse(code);
  let currentScope = Object.create(scope);
  let EXPORTS = evaluate(ast, currentScope) 
  REQUIRE.cache[name[0].value] = EXPORTS;
  return EXPORTS;
}

specialForms['require'] = REQUIRE;

/**
 * @description Función que a partir de un programa Egg lo ejecuta llamando
 * a evaluate con el AST del programa y el ámbito
 * @param {string} program Programa egg entero que va a ser ejecutado
 * @return Devuelve el resultado de ejecutar el programa egg
 */
function run(program) {
  // console.log(util.inspect(parse(program), {showHidden: false, depth: null}))
  return evaluate(parse(program), Object.create(topScope));
}

/**
 * @description Función que ejecuta el programa egg desde un fichero
 * @param {string} file Nombre del fichero
 * @return Devuelve el resultado de ejecutar el programa egg
 */
function runFromFile(file) {
  let program = FS.readFileSync(file, 'utf8'); 
  return run(program)
}

/**
 * @description Ejecuta el programa precompilado de egg
 * @param {string} file Nombre del fichero en formato evm
 * @return Devuelve el resultado de ejecutar el programa egg
 */
function runFromEVM(file) {
  try {
    let json = FS.readFileSync(file, 'utf8');
    let tree = JSON.parse(json);
    let scope = Object.create(topScope);
    return evaluate(Json2AST.Json2AST(tree), scope);
  }
  catch (err) {
    console.log(err);
  }
}

module.exports = {
  run, 
  runFromFile, 
  runFromEVM, 
  topScope, 
  specialForms, 
  parse, 
  evaluate
};