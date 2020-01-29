/**
 * require fibjs >= 0.26.0
 */
const vm = require('vm')

const UTILs = require('./_utils')

exports.generateLoaderbox = function generateLoaderbox (tsCompilerOptions) {
    const tsSandbox = new vm.SandBox(UTILs.builtModules)

    UTILs.registerTsCompiler(tsSandbox, tsCompilerOptions)

    return tsSandbox
}
exports.defaultBox = generateLoaderbox()
