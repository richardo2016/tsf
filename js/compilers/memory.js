const vm = require('vm')
const uuid = require('uuid')

const { typescript : ts } = require('../typescript-apis/runtime')

const TSFError = require('../error')

const CORE = require('../core')

const { diagnosticsReporter } = require('../typescript-apis/runtime');

const SCRIPT_NAME = '__temp:'
const GLOBAL_PROXY_SANDBOX = new vm.SandBox({}, name => require(name))

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
/**
    // This is a shortcut function for transpileModule - it accepts transpileOptions as parameters and returns only outputText part of the result.
    
    function transpile(input, compilerOptions, fileName, diagnostics, moduleName) {
        var output = transpileModule(input, { compilerOptions: compilerOptions, fileName: fileName, reportDiagnostics: !!diagnostics, moduleName: moduleName });
        // addRange correctly handles cases when wither 'from' or 'to' argument is missing
        ts.addRange(diagnostics, output.diagnostics);
        return output.outputText;
    }
 */
const transpileTypescript = exports.transpileTypescript = function (
    tsRaw = '',
    compilerOptions,
    tsfTranspileOptions
) {
    const {
        toModule = false,
        sandbox: mSandbox = GLOBAL_PROXY_SANDBOX,
        /* transpile about configuration :start */
        fileName,
        moduleName = fileName,
        renamedDependencies = {},
        diagnostics,
        /* transpile about configuration :end */
        ...tsfOptions
    } = tsfTranspileOptions || {}

    if (diagnostics && !Array.isArray(diagnostics))
        throw new TSFError(`'diagnostics' must be diagnostic info Array!`, TSFError.LITERALS.TYPE_ASSERT)

    if (!toModule) {
        const result = CORE.transpileModule(tsRaw, {
            compilerOptions,
            fileName,
            reportDiagnostics: !!diagnostics,
            moduleName,
            renamedDependencies,
            transformers: {},
            tsfOptions
        })

        ts.addRange(diagnostics, result.diagnostics)

        return result.outputText
    }

    const jsScript = transpileTypescript(tsRaw, compilerOptions, { ...tsfOptions, toModule: false })

    const mName = [`${SCRIPT_NAME}//${uuid.snowflake().hex()}?sourcefile=${fileName}&modname=moduleName`].join('')
    mSandbox.addScript(mName, jsScript)

    return mSandbox.require(mName, __dirname)
}