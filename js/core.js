'use strict';

const typescript = require('typescript')
const { extend } = require('util')

const TSFError = require('./error')

require('./typescript-apis/runtime');

// CompilerOptions
const DFLT_COMPILEROPTIONS = {
    module: typescript.ModuleKind.CommonJS
}

function _getOptions(options, locals) {
    return extend({}, DFLT_COMPILEROPTIONS, options, locals)
}

exports.inputExt = '.ts'
exports.outputExt = '.js'
exports.logPrefix = '[tsf]'

const _filterCompilerOptions = exports._filterCompilerOptions = function (tsCompilerOptions) {
    if (tsCompilerOptions.sourceMap) {
        console.warn(`[tsf] don't support sourceMap now, tranform to 'inlineSourceMap' automatically.`)
        tsCompilerOptions.sourceMap = false
        tsCompilerOptions.inlineSourceMap = true
    }
}

exports.transpileModule = function (input, transpileOptions, locals) {
    if (!input)
        throw new TSFError('typescript inputed empty', TSFError.LITERALS.TYPESCRIPT_SOURCE_EMPTY)

    if (transpileOptions.compilerOptions)
        _filterCompilerOptions(transpileOptions.compilerOptions)

    transpileOptions.compilerOptions = _getOptions(transpileOptions.compilerOptions, locals)

    return typescript.transpileModule(input, transpileOptions)
}