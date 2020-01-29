const vm = require('vm')
const uuid = require('uuid')
const typescript = require('typescript')

const TSFError = require('../error')

const CORE = require('../core')

const SCRIPT_NAME = '__temp:'
const GLOBAL_PROXY_SANDBOX = new vm.SandBox({}, name => require(name))

/**
    // This is a shortcut function for transpileModule - it accepts transpileOptions as parameters and returns only outputText part of the result.
    
    function transpile(input, compilerOptions, fileName, diagnostics, moduleName) {
        var output = transpileModule(input, { compilerOptions: compilerOptions, fileName: fileName, reportDiagnostics: !!diagnostics, moduleName: moduleName });
        // addRange correctly handles cases when wither 'from' or 'to' argument is missing
        ts.addRange(diagnostics, output.diagnostics);
        return output.outputText;
    }
 */
// customize my own shortcuts of `typescript.transpileModule`
const transpileTypescript = exports.transpileTypescript = function (transpileArgs, options) {
    const [tsRaw = '', compilerOptions, filename, diagnostics, moduleName] = transpileArgs || []

    const {
        toModule = false,
        onTranspiledModule = CORE.defaultOnTranspiledModuleResult
    } = options || {}

    if (typeof onTranspiledModule !== 'function')
        throw new TSFError(`'onTranspiledModule' must be function!`, TSFError.LITERALS.TYPE_ASSERT)

    if (!toModule) {
        const result = CORE.transpileModule(tsRaw, {
            compilerOptions,
            filename,
            diagnostics,
            moduleName
        })

        typescript.addRange(diagnostics, result.diagnostics)

        onTranspiledModule(result, options)

        return result.outputText
    }

    const jsScript = transpileTypescript(transpileArgs, { ...options, toModule: false })

    const sname = `${SCRIPT_NAME}//${uuid.snowflake().hex()}`
    GLOBAL_PROXY_SANDBOX.addScript(sname, jsScript)

    return GLOBAL_PROXY_SANDBOX.require(sname, __dirname)
}