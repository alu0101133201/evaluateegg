const utils = require('./utils.js')

/**
 * @description Método que accede a la posición de un array de forma recursiva, es
 * decir, en el caso de que haya un objeto iterable dentro de otro objeto iterable
 * @param {array} indices Array de índices con las posiciones a las que queremos acceder de
 * forma recursiva
 * @returns {Value} Valor de la posición solicitada
 */
Object.prototype.sub = function(...indices) {
  utils.checkIterable(this, indices.length);
  let index = indices[0];
  if (this instanceof Array) {
    index = utils.getValidIndex(this.length, indices[0]);
  }
  let value;
  value = this[index];
  if (indices.length === 1)
    return value;
  return value.sub(...indices.slice(1));
}

/**
 * @description Modifica el valor de una posición determinada en un objeto
 * iterable. La posición puede ser accedida de forma recursiva para elementos 
 * iterables contenidos en otros objetos iterables
 * @param {*} value Valor a sustituir
 * @param {array} indices Posición donde quiero colocar el nuevo valor
 */
Object.prototype["setElem"] = Object.prototype["="] = function (value, ...indices) {
  utils.checkIterable(this, indices.length);
  if (this instanceof Array) {
    index = utils.getValidIndex(this.length, indices[0]);
  } else if (this instanceof Map) {
    index = indices[0];
  }
  if (indices.length === 1) {
    if(this instanceof Map){
      this[index] = value;
    } else {
      this[index] = value;
    }
    return value;
  }
  let obj = this.sub(index);
  return (obj["="](value, ...indices.slice(1)));
}

