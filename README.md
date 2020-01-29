## Fibjs App Starter

[![NPM version](https://img.shields.io/npm/v/@fibjs/tsf.svg)](https://www.npmjs.org/package/@fibjs/tsf)
[![Build Status](https://travis-ci.org/anoymous/app.svg)](https://travis-ci.org/anoymous/app)
[![Build status](https://ci.appveyor.com/api/projects/status/plarvl262d7279c3?svg=true)](https://ci.appveyor.com/project/anoymous/app)

## Install

```sh
npm install @fibjs/tsf
```

## Javascript APIs

```js
const TSF   = require("@fibjs/tsf");

// return compiled javascript string
TSF.compilers.compile(typescript)

// compile to target file(if permitted, or throw error)
TSF.compilers.compileTo(typescript, '/path/to/file')

// compile file(if accessible, or throw error)
TSF.compilers.compileFile('/path/from/dir')

// compile directory(if accessible, or throw error), as file dictionary by default
TSF.compilers.compileDirectory('/path/from/dir')
// compile directory(if accessible, or throw error), as zip in memory
TSF.compilers.compileDirectory('/path/from/dir', { asZip: true })

// compile file to target file(if permitted, or throw error)
TSF.compilers.compileFileTo('/path/from/dir', '/path/to/dir')

// compile dir to target dir(if permitted, or throw error), recursively by default.
TSF.compilers.compileDirectoryTo('/path/from/dir', '/path/to/dir')
// same as previous api but target is one zip file
TSF.compilers.compileDirectoryTo('/path/from/dir', '/path/to/dir.zip')
```

## Test

To test, first make sure you have development dependencies installed. Go to the root folder and do:

```sh
npm install
```

Then, just run the tests.

```sh
npm test
```
