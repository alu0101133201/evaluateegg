const { specialForms } = require('./registry')

/** Clase que representa un elemento valor en egg */
class Value {
  /**
   * @constructor
   * @description Constructor de la clase valor que contiene los atributos tipo,
   * el valor, la columna y la línea
   * @param {object} token Token que contiene los valores
   */
  constructor(token) {
    this.type = "value";
    this.value = token.value;
    this.offset = token.offset;
    this.line = token.line;
  }

  /**
   * @description Método que devuelve evalúa el token.  
   * En este caso cosnta de devolver el valor del token
   * @param {object} scope Ámbito en el que estamos trabajando
   * @return Valor del token que estamos evaluando
   */
  evaluate(scope) {
    return this.value;
  }
}

/** Clase que representa el word en egg */
class Word {
  /**
   * @constructor
   * @description Constructor de la clase word que contiene los atributos tipo,
   * el nombre de la palabra, la columna y la línea
   * @param {object} token Token que contiene los valores
   */
  constructor(token) {
    this.type = "word";
    this.name = token.name;
    this.offset = token.offset;
    this.line = token.line;
  }
  /**
   * @description Método que evalúa el elemento. En este caso 
   * comprueba si el nombre de esa palabra existe en el ámbito y si es así, devuelve su valor
   * @param {object} scope Ámbito
   * @returns Valor de la variable
   * @throws {ReferenceError} Si la palabra no existe en el ámbito (por lo que no
   * está declarada)
   */
  evaluate(scope) {
    if (this.name in scope) {
      return scope[this.name];
    } else {
      throw new ReferenceError(
        `Undefined binding: ${this.name} at line: ${this.line}`);
    }
  }
}

/** Clase que representa el aplicación en egg */
class Apply {
  /**
 * @constructor
 * @description Constructor de la clase Apply que contiene los atributos tipo,
 * el operador y sus argumentos
 * @param {object} expr Token que contiene los valores
 */
  constructor(expr) {
    this.type = "apply"; 
    this.operator = expr;
    this.args = [];
  }
  
  /**
   * @description Método que evalúa una aplicación. Se encarga de ejecutarla
   * si es una specialForm o, en caso contrario, evaluarla como una función o como un método.
   * @param {object} scope Ámbito
   * @returns {Value} Retorna el resultado de la aplicación
   * 
   */
  evaluate(scope) {
    if (this.operator.type === "word" &&
      this.operator.name in specialForms) {
      return specialForms[this.operator.name](this.args, scope);
    } else {
      let op = this.operator.evaluate(scope);
      let evArgs = this.args.map((arg) => arg.evaluate(scope));
      if ((typeof op === 'function') && !(evArgs.length > 0 && typeof(evArgs[0]) !== 'object' && op[evArgs[0]])) {
        return op(...evArgs);
      } else {
        let name = evArgs[0];
        if (typeof(op[name]) !== 'undefined') {
          if (typeof(op[name]) === 'function') {
            return (...args) => op[name].call(op, ...args);
          } else {
            return op[name];
          }
        }
      }
    }
  }  
}

module.exports = {
  Value,
  Word,
  Apply
}