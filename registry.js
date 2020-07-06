const monkeyPatching = require('./monkey-patching.js')
const specialForms = Object.create(null);

specialForms.if = (args, scope) => {
  if (args.length != 3) {
    throw new SyntaxError(`Wrong number of args to if. Excepted 3 got ${args.length}`);
  } else if (evaluate(args[0], scope) !== false) {
    return evaluate(args[1], scope);
  } else {
    return evaluate(args[2], scope);
  }
};

specialForms.while = (args, scope) => {
  if (args.length != 2) {
    throw new SyntaxError(`Wrong number of args to while. Expected 2 got ${args.length}`);
  }
  while (evaluate(args[0], scope) !== false) {
    evaluate(args[1], scope);
  }
  return false;
};

specialForms.do = (args, scope) => {
  let value = false;
  for (let arg of args) {
    value = evaluate(arg, scope);
  }
  return value;
};

specialForms[":="] = specialForms.def = specialForms.define = (args, scope) => {
  if (args.length != 2 || args[0].type != "word") {
    if (args.length === 2) 
      throw new SyntaxError(`Incorrect use of define at line ${args[0].line}. Not using a word`);
    else 
      throw new SyntaxError(`Incorrect use of define at line ${args[0].line}. Expect 2 arguments`);
  }
  let value = evaluate(args[1], scope);
  scope[args[0].name] = value;
  return value;
};

specialForms["="] = specialForms.set = (args, scope) => {
  let name = args[0].name;
  let value = evaluate(args[args.length - 1], scope);
  // Recorremos los ámbitos hasta llegar al que contiene la variable buscada
  for (let currentScope = scope; currentScope; 
      currentScope = Object.getPrototypeOf(currentScope)) {
    if (Object.prototype.hasOwnProperty.call(currentScope, args[0].name)) {
      // Asignación simple
      if (args.length === 2) {
        currentScope[name] = value;
        return value;
      }

      // Asignación anidada
      let currentObject = currentScope[name];
      if (typeof currentObject !== 'object')
        throw new ReferenceError(`¡Error! Intentando settear con múltiples índices a un objeto escalar - ${name}`)
    
      for (let indexIter = 1; indexIter < (args.length - 2); indexIter++) {
        currentObject = currentObject[args[indexIter].value];
      }
      currentObject[args[args.length - 2].value] = value;
      return value;
    }
  }
  throw new TypeError(`setting a non-existing variable at line: ${args[0].line}`);
};
// fun(x, y, +(x,*(y,3)))
specialForms["->"] = specialForms.fun = (args, scope) => {
  if (!args.length) {
    throw new SyntaxError("Functions need a body");
  }
  let body = args[args.length - 1];
  let params = args.slice(0, args.length - 1).map(expr => {
    if (expr.type != "word") {
      throw new SyntaxError(`Parameter names must be words. At line ${expr.line}`);
    }
    return expr.name;
  });
  return function() {
    if (arguments.length != params.length) {
      throw new TypeError(`Wrong number of arguments. Expected ${params.length} got ${arguments.length}`);
    }
    let localScope = Object.create(scope);
    for (let i = 0; i < arguments.length; i++) {
      localScope[params[i]] = arguments[i];
    }
    return evaluate(body, localScope);
  };
};

specialForms["map"] = (args, scope) => {
  if (args.length % 2) {
    throw new TypeError(`Number of parameters must be pair`);
  }
  let mapResult = new Map([]);
  for (let i = 0; i < args.length; i += 2) {
    mapResult[args[i].value] = evaluate(args[i + 1], scope)
  }
  return mapResult;
};

specialForms["object"] = (args, scope) => {
  if (args.length % 2) {
    throw new TypeError(`Number of parameters must be pair`);
  }
  let object = Object.create(scope);
  object['this'] = object;

  let name;
  let value;
  for (let i = 0; i < args.length; i += 2) {
    name = args[i].value;
    value = args[i + 1].evaluate(object);
    if (value.constructor === Function) {
      value = value.bind(object);
    }
    object[name] = value;
  }
  return object;
}

specialForms['for'] = (args, scope) => {
  let forScope = Object.create(scope);
  args[0].evaluate(forScope);
  while (args[1].evaluate(forScope)) {
    args[3].evaluate(forScope);
    args[2].evaluate(forScope);
  }
};

specialForms['foreach'] = (args, scope) => {
  let forEachScope = Object.create(scope);
  let iter = args[1].evaluate(forEachScope);

  for (let value of iter) {
    forEachScope[args[0].name] = value;
    args[2].evaluate(forEachScope);
  }
};

specialForms["++"] = function(args, scope) {
  let valName = args[0].name;
  for (let currentScope = scope; currentScope; currentScope = Object.getPrototypeOf(currentScope)) {
    if (Object.prototype.hasOwnProperty.call(currentScope, valName)) {
      currentScope[valName] = currentScope[valName] + 1;
      return currentScope[valName];
    }
  }
  throw new ReferenceError(`Tried setting an undefined variable in line ${args[0].line}:${valName}`);
};

// -----TOPSCOPE----
const topScope = Object.create(null);

topScope.true = true;
topScope.false = false;

topScope['RegExp'] = require('xregexp')

for (let op of ["+", "-", "*", "/", "==", "<", ">", "<=", ">=", "||", "&&", "!=", "+=", "-=", "<<", ">>"]) {
  topScope[op] = Function("a, b", `return a ${op} b;`);
}

topScope.print = value => {

  console.log(value);
  return value;
};

topScope["arr"] = topScope["array"] = function(...args) {
  return args;
};

topScope["length"] = function(array) {
  return array.length;
};

topScope["<-"] = topScope["[]"] = topScope["element"] = function(array, ...n) {
  if (n.length < 1) {
    throw new SyntaxError(`¡Error! Provee al menos un índice para acceder al array ${array}`)
  }

  let currentArray = array;

  for (let i = 0; i < n.length; i++) {
    let value = (n[i] < 0)? currentArray.length + n[i] : n[i];
    currentArray = currentArray[value];
  }

  if ((currentArray === undefined) || (currentArray === null))
    throw Error(`¡Error! Indexando ${array} con índices ${n}. Accediendo a un elemento no definido`);
  return currentArray;
};

/**
 * @description Evalúa un token y devuelve su valor
 * @param {object} expr Token a analizar  
 * @param {object} scope Ámbito
 */
function evaluate(expr, scope) {
  return expr.evaluate(scope);
}

module.exports = {
  specialForms,
  evaluate,
  topScope
};