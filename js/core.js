'use strict';

const typescript = require('typescript')
const ts = typescript;
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

    // return typescript.transpileModule(input, transpileOptions)
    return tsf_transpileModule(input, transpileOptions)
}

/**
 * @see https://sourcegraph.com/github.com/microsoft/TypeScript@6769313/-/blob/src/services/transpile.ts#L26
 * @see https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
 * 
 * @description customized typescript compiler
 * 
 * @param {*} input input typescript
 * @param {*} transpileOptions transpile options
 */
const tsf_transpileModule = function (input, transpileOptions) {
    const diagnostics = [];
    const options = transpileOptions.compilerOptions ? ts.fixupCompilerOptions(transpileOptions.compilerOptions, diagnostics) : {};
    // mix in default options
    const defaultOptions = ts.getDefaultCompilerOptions();
    for (const key in defaultOptions) {
        if (ts.hasProperty(defaultOptions, key) && options[key] === undefined) {
            options[key] = defaultOptions[key];
        }
    }
    for (let opt_i = 0, transpileOptionValueCompilerOptions_1 = ts.transpileOptionValueCompilerOptions; opt_i < transpileOptionValueCompilerOptions_1.length; opt_i++) {
        const option = transpileOptionValueCompilerOptions_1[opt_i];
        options[option.name] = option.transpileOptionValue;
    }
    // transpileModule does not write anything to disk so there is no need to verify that there are no conflicts between input and output paths.
    options.suppressOutputPathCheck = true;
    // Filename can be non-ts file.
    options.allowNonTsExtensions = true;
    // if jsx is specified then treat file as .tsx
    const inputFileName = transpileOptions.fileName || (transpileOptions.compilerOptions && transpileOptions.compilerOptions.jsx ? "module.tsx" : "module.ts");
    const sourceFile = ts.createSourceFile(inputFileName, input, options.target); // TODO: GH#18217
    if (transpileOptions.moduleName) {
        sourceFile.moduleName = transpileOptions.moduleName;
    }
    if (transpileOptions.renamedDependencies) {
        sourceFile.renamedDependencies = ts.createMapFromTemplate(transpileOptions.renamedDependencies);
    }
    const newLine = ts.getNewLineCharacter(options);
    // Output
    let outputText;
    let sourceMapText;
    // Create a compilerHost object to allow the compiler to read and write files
    const compilerHost = {
        getSourceFile: function (fileName) { return fileName === ts.normalizePath(inputFileName) ? sourceFile : undefined; },
        writeFile: function (name, text) {
            if (ts.fileExtensionIs(name, ".map")) {
                ts.Debug.assertEqual(sourceMapText, undefined, "Unexpected multiple source map outputs, file:", name);
                sourceMapText = text;
            }
            else {
                ts.Debug.assertEqual(outputText, undefined, "Unexpected multiple outputs, file:", name);
                outputText = text;
            }
        },
        getDefaultLibFileName: function () { return "lib.d.ts"; },
        useCaseSensitiveFileNames: function () { return false; },
        getCanonicalFileName: function (fileName) { return fileName; },
        getCurrentDirectory: function () { return ""; },
        getNewLine: function () { return newLine; },
        fileExists: function (fileName) { return fileName === inputFileName; },
        readFile: function () { return ""; },
        directoryExists: function () { return true; },
        getDirectories: function () { return []; }
    };
    const program = ts.createProgram([inputFileName], options, compilerHost);
    if (transpileOptions.reportDiagnostics) {
        ts.addRange(/*to*/ diagnostics, /*from*/ program.getSyntacticDiagnostics(sourceFile));
        ts.addRange(/*to*/ diagnostics, /*from*/ program.getSemanticDiagnostics(sourceFile));
        ts.addRange(/*to*/ diagnostics, /*from*/ program.getDeclarationDiagnostics(sourceFile));
        ts.addRange(/*to*/ diagnostics, /*from*/ program.getOptionsDiagnostics());
    }
    // Emit
    program.emit(/*targetSourceFile*/ undefined, /*writeFile*/ undefined, /*cancellationToken*/ undefined, /*emitOnlyDtsFiles*/ undefined, transpileOptions.transformers);
    if (outputText === undefined)
        return ts.Debug.fail("Output generation failed");
    return { outputText: outputText, diagnostics: diagnostics, sourceMapText: sourceMapText };
}