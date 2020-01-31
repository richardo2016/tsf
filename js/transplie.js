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
    // Create a compilerHost object to allow the compiler to read and write files
    const compilerHost__ = {
        getSourceFile: function (fileName) { return fileName === ts.normalizePath(inputFileName) ? sourceFile : undefined; },
        writeFile: function (name, text) {
            if (ts.fileExtensionIs(name, ".map")) {
                ts.Debug.assertEqual(sourceMapText, undefined, "Unexpected multiple source map outputs, file:", name);
                sourceMapText = text;
            } else {
                ts.Debug.assertEqual(outputText, undefined, "Unexpected multiple outputs, file:", name);
                outputText = text;
            }
        },
        getDefaultLibFileName: function (options) { return ts.combinePaths(getDefaultLibLocation(), ts.getDefaultLibFileName(options)); },
        useCaseSensitiveFileNames: function () { return false; },
        getCanonicalFileName: function (fileName) { return fileName; },
        getCurrentDirectory: function () {
            return ts.sys.getCurrentDirectory();
        },
        getNewLine: function () { return newLine; },
        fileExists: function (fileName) { return fileName === inputFileName; },
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

    if (outputText === undefined)
        return ts.Debug.fail("Output generation failed");
        
    return { outputText: outputText, diagnostics: diagnostics, sourceMapText: sourceMapText };
}