'use strict';

const path = require('path')
const typescript = require('typescript')
const { extend } = require('util')

const TSFError = require('./error')

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

// @copy from typescript.d.ts
/**
    interface TranspileOptions {
        compilerOptions?: CompilerOptions;
        fileName?: string;
        reportDiagnostics?: boolean;
        moduleName?: string;
        renamedDependencies?: MapLike<string>;
        transformers?: CustomTransformers;
    }
    interface TranspileOutput {
        outputText: string;
        diagnostics?: Diagnostic[];
        sourceMapText?: string;
    }
 */
exports.transpileModule = function (input, transpileOptions, locals) {
    if (!input)
        throw new TSFError('typescript inputed empty', TSFError.LITERALS.TYPESCRIPT_SOURCE_EMPTY)

    if (transpileOptions.compilerOptions)
        _filterCompilerOptions(transpileOptions.compilerOptions)

    transpileOptions.compilerOptions = _getOptions(transpileOptions.compilerOptions, locals)

    return typescript.transpileModule(input, transpileOptions)
}

exports.defaultOnTranspiledModuleResult = function (result, options) {
    const { reportError = true } = options || {}

    // if (reportError)
    //     console.info('result.diagnostics', result.diagnostics)
}