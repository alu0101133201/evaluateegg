const {Value, Word, Apply} = require('./parse.js');

class Json2AST {
  static json2node = Object.create(null);

  static Json2AST(tree) {
    if (tree && tree.type && this.json2node[tree.type](tree)) {
      return this.json2node[tree.type](tree);
    }
    else {
      throw new SyntaxError (`Unrecognized token`);
    }
  }
}

let json2node = Json2AST.json2node;

json2node.apply = (tree) => {
  let obj = new Apply(tree);
  obj.operator = Json2AST.Json2AST(tree.operator);
  obj.args = tree.args.map(arg => Json2AST.Json2AST(arg));
  return obj;
}

json2node.word = (tree) => {
  let obj = new Word(tree);
  return obj;
}

json2node.value = (tree) => {
  let obj = new Value(tree);
  return obj;
}

module.exports = { Json2AST }