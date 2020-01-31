const typescript = require('typescript')
const ts = typescript

exports.typescript = typescript

require('./ts.sys').configTsSys(typescript);

// ts.transpileOptionValueCompilerOptions = ts.optionDeclarations.filter(function (option) {
//     allow_declarations: {
//         // if (option.name === 'declaration') return false
//         // if (option.name === 'declarationMap') return false
//         // if (option.name === 'emitDeclarationOnly') return false
//     }
    
//     allowOutFile: {
//         // if (option.name === 'outFile') return false
//     }
//     return ts.hasProperty(option, "transpileOptionValue");
// });
require('./ts.tsf_createDiagnosticReporter').config(typescript);

exports.diagnosticsReporter = ts.tsf_createDiagnosticReporter(ts.sys, true);