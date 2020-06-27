/** 
 * @author Esther Jorge Paramio y Sergio Guerra Arencibia 
 * Universidad de La Laguna
 * Procesadores de lenguaje
 * @file Fichero que implementa y exporta ciertas utilidades
 * y sintáctico
 * @since 15-04-20
 */

const inspect = require('util').inspect;

/**
 * @description Esta función se encarga de comprobar si un objeto es iterable.
 * @param {Object} object Recibe el objeto que se quiere saber si es iterable
 * @param {Number} length Número de índices que se van a iterar (mínimo uno)
 * @throws {SyntaxError} Si no recibe ningún índice
 * @throws {TypeError} Si el objeto no es iterable
 */
const checkIterable = (object, length) => {
  if (length === 0) {
    throw new SyntaxError('At least one index must be passed to sub');
  }

  if (!object || object instanceof Number || object instanceof String) {
    throw new TypeError(`The object '${object}' is not indexable!`);
  }
};

/**
 * @description Esta función comprueba que el índice si el índice para acceder a un
 * array es válido. Si es negativo, se modifica para que sea accesible por el final
 * del array
 * @param {number} length Tamaño del array
 * @param {number} index Índice al que se quiere acceder
 * @throws {TypeError} El índice no es un número
 * @throws {RangeError} El índice se sale del array
 * @return Devuelve el índice
 */
const getValidIndex = (length, index) =>  {
  if (index !== parseInt(index, 10))
    throw new TypeError(`Index ${index} is not a number. Array size: ${length}`);
  
  if (index < 0) {
    index = length + index;
  }
  if (index > length) {
    throw new RangeError(`Index ${index} is out of bounds. Array size ${length}`);
  }
  return index;
}

module.exports = {
  checkIterable,
  getValidIndex
}