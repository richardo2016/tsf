const ts = require('../js/typescript-apis/runtime')

/**
 * @TODO await implementation
 * @ref https://sourcegraph.com/github.com/microsoft/TypeScript@6769313/-/blob/src/executeCommandLine/executeCommandLine.ts
 */
ts.executeCommandLine(ts.sys, {
    onCompilerHostCreate: ts.noop,
    onCompilationComplete: ts.noop,
    onSolutionBuilderHostCreate: ts.noop,
    onSolutionBuildComplete: ts.noop
}, ts.sys.args);