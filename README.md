# evaluateegg
# Evaluate method for egg lenguage
### Esther Jorge Paramio, Sergio Guerra Arencibia

This module implements an evaluate method for an implementation of an egg lenguage.

## Install

```
  npm install evaluateegg
```

## Egg example
```
do(
  define(x, 4),
  define(setx, fun(val, 
      set(x, val)
    )
  ),
  setx(50),
  print(x)
)
```

## Usage

main functions:
  - parse (build the AST for a given code)
  - parseFromFile (build the AST a given file)
  - runFromFile (Interpret the AST given)
  - runFromEVM (Interpret the AST given in an EVM file)

```js
  const { runFromEVM } = require('evaluategg/eggvm');
  const { fs } = require('fs');

  let filename = fs.readFileSync('yourEggCode.egg', 'utf-8');
  runFromEVM(filename);
```