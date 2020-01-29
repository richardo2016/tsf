const CORE = require('../core')

const TSFError = require('../error')

exports.compile = function (tsRaw = '', tsCompilerOptions, filename, diagnostics, moduleName) {
    if (!tsRaw)
        throw new TSFError('typescript inputted empty', TSFError.LITERALS.TYPESCRIPT_SOURCE_EMPTY)

    return CORE._getTranspilor(tsCompilerOptions, filename, diagnostics, moduleName)(tsRaw)
}