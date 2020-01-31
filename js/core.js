const fs = require('fs')
const { extend } = require('util')

const { typescript } = require('./typescript-apis/runtime')
const ts = typescript;
const os = require('os')

const TSFError = require('./error')

// CompilerOptions
const DFLT_COMPILEROPTIONS = {
    module: typescript.ModuleKind.CommonJS
}

function _getOptions(compilerOptions, locals) {
    compilerOptions = extend({}, DFLT_COMPILEROPTIONS, compilerOptions, locals)

    if (compilerOptions.sourceMap) {
        console.warn(`[tsf] don't support sourceMap now, tranform to 'inlineSourceMap' automatically.`)
        compilerOptions.sourceMap = false
        compilerOptions.inlineSourceMap = true
    }

    return compilerOptions
}

exports.inputExt = '.ts'
exports.outputExt = '.js'
exports.logPrefix = '[tsf]'

/**
 * @see https://sourcegraph.com/github.com/microsoft/TypeScript@6769313/-/blob/src/services/transpile.ts#L26
 * @see https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
 * 
 * @description customized typescript compiler
 * 
 * @param {*} input typescript inputs
 * @param {*} transpileOptions transpile options
 */
const WRITE_TARGETS = {
    MEMORY: 'MEMORY',
    IO: 'IO'
}

exports.transpileModule = function (
    input,
    tsfTranspileOptions
) {
    if (!input)
        throw new TSFError('typescript inputed empty', TSFError.LITERALS.TYPESCRIPT_SOURCE_EMPTY)

    tsfTranspileOptions = extend({}, tsfTranspileOptions)
    const { tsfOptions = {}, ...transpileOptions } = tsfTranspileOptions || {};
    transpileOptions.compilerOptions = _getOptions(transpileOptions.compilerOptions)
    
    const { writeTarget = WRITE_TARGETS.MEMORY } = tsfOptions || {};
    
    assert(!!WRITE_TARGETS[writeTarget], `writeTarget must be one of ${Object.values(WRITE_TARGETS).join(', ')}`)

    const diagnostics = [];
    const options = transpileOptions.compilerOptions ? ts.fixupCompilerOptions(transpileOptions.compilerOptions, diagnostics) : {};
    // mix in default options
    const defaultOptions = ts.getDefaultCompilerOptions();
    for (const key in defaultOptions) {
        if (ts.hasProperty(defaultOptions, key) && options[key] === undefined) {
            options[key] = defaultOptions[key];
        }
    }
    
    for (let opt_i = 0, _transpileOptionValueCompilerOptions = ts.transpileOptionValueCompilerOptions; opt_i < _transpileOptionValueCompilerOptions.length; opt_i++) {
        const option = _transpileOptionValueCompilerOptions[opt_i];
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
    const newLine = os.EOL;
    // Output
    let outputText;
    let sourceMapText;

    function getDefaultLibLocation() {
        if (ts.sys)
            return ts.getDirectoryPath(ts.normalizePath(ts.sys.getExecutingFilePath()));

        return "lib.d.ts"
    }

    function swapCase(s) {
        return s.replace(/\w/g, function (ch) {
            var up = ch.toUpperCase();
            return ch === up ? ch.toLowerCase() : up;
        });
    }
    // Create a compilerHost object to allow the compiler to read and write files
    const compilerHost__ = {
        /* @tsf_checked */
        getSourceFile: function (fileName) {
            return fileName === ts.normalizePath(inputFileName) ? sourceFile : undefined;
        },
        writeFile: function (name, text) {
            /* 
                if writeTarget === WRITE_TARGETS.MEMORY, transpileOptions.fileName must be provided, as `name` here would be 
                computed automatically(transpileOptions.outDir would be referenced in it)
            */

            if (writeTarget === WRITE_TARGETS.MEMORY || !transpileOptions.fileName)
                if (ts.fileExtensionIs(name, ".map")) {
                    ts.Debug.assertEqual(sourceMapText, undefined, "Unexpected multiple source map outputs, file:", name);
                    sourceMapText = text;
                } else {
                    ts.Debug.assertEqual(outputText, undefined, "Unexpected multiple outputs, file:", name);
                    
                    outputText = text;
                }
            else /* write name */
                fs.writeTextFile(name, text)
        },
        getDefaultLibFileName: function (options) {
            return ts.combinePaths(getDefaultLibLocation(), ts.getDefaultLibFileName(options));
        },
        useCaseSensitiveFileNames: function () {
            if (process.platform === "win32" || process.platform === "win64")
                return false;

            return !ts.sys.fileExists(swapCase(__filename));
        },
        getCanonicalFileName: function (fileName) {
            // console.log('[compilerHost::getCanonicalFileName]', fileName)
            return fileName;
        },
        getCurrentDirectory: function () {
            return ts.sys.getCurrentDirectory();
        },
        getNewLine: function () {
            return newLine;
        },
        fileExists: function (fileName) {
            return fileName === inputFileName;
        },
        readFile: function () { return ""; },
        directoryExists: function () { return true; },
        getDirectories: function () { return []; },


        getFileSize: function (path) {
            try {
                const stat = _fs.statSync(path);
                if (stat.isFile()) {
                    return stat.size;
                }
            }
            catch (_a) { }
            return 0;
        },
    };

    let compilerHost
    compilerHost = compilerHost__

    const program = ts.createProgram([inputFileName], options, compilerHost);
    if (transpileOptions.reportDiagnostics) {
        ts.addRange(/*to*/ diagnostics, /*from*/ program.getSyntacticDiagnostics(sourceFile));
        ts.addRange(/*to*/ diagnostics, /*from*/ program.getSemanticDiagnostics(sourceFile));
        ts.addRange(/*to*/ diagnostics, /*from*/ program.getDeclarationDiagnostics(sourceFile));
        ts.addRange(/*to*/ diagnostics, /*from*/ program.getOptionsDiagnostics());
    }
    // Emit
    program.emit(
        /*targetSourceFile*/ undefined, 
        /*writeFile*/ undefined, 
        /*cancellationToken*/ undefined, 
        /*emitOnlyDtsFiles*/ undefined,
        transpileOptions.transformers
    );

    if (writeTarget === WRITE_TARGETS.MEMORY && outputText === undefined)
        return ts.Debug.fail("Output generation failed");
        
    return { outputText: outputText, diagnostics: diagnostics, sourceMapText: sourceMapText };
}