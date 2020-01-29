const vm = require('vm')
const fs = require('fs')
const path = require('path')
const util = require('util')

const mkdirp = require('@fibjs/mkdirp')

const TSFError = require('./error');

const CORE = require('./core');

function time () {
    return new Date()
}
const isDebug = exports.isDebug = !!process.env.FIB_DEBUG

exports.mkdirp = (...args) => {
    isDebug && console.log(`${getLogPrefix('io', 'mkdirp')}`)
    return mkdirp(...args)
}

exports.overwriteFile = (srcpath, distpath) => {
    if (fs.exists(distpath)) {
        const stat = fs.stat(distpath)

        if (stat.isDirectory()) {
            rmdirr(distpath)
        } else {
            fs.unlink(distpath)
        }
    }

    fs.copy(srcpath, distpath)
}

exports.getLogPrefix = function getLogPrefix (domain = 'default', action = 'action') {
    return `${CORE.logPrefix}[${domain}:${action}] - [${time()}]  `
}


exports.extendCompilerConfigFromTSConfig = function (origConfig = {}) {
    let tsConfigFilepath = path.resolve(process.cwd(), 'tsconfig.json')

    if (tsConfigFilepath && fs.exists(tsConfigFilepath) && fs.stat(tsConfigFilepath).isFile()) {
        let tsConfig = require(tsConfigFilepath) || {}
        origConfig = util.extend({}, origConfig, tsConfig.compilerOptions)
    }

    return origConfig
}

exports.defaultCompilerOptions = require('../tsconfig.dft.json')

exports.getCwdTsCompilerOptions = function () {
    return exports.extendCompilerConfigFromTSConfig(util.extend({}, exports.defaultCompilerOptions))
}

const TS_SUFFIX = exports.TS_SUFFIX = '.ts'
const SOURCEMAP_SUFFIX = exports.SOURCEMAP_SUFFIX = '.map'

exports.builtModules = require('@fibjs/builtin-modules/lib/util/get-builtin-module-hash')()
exports.defaultSandboxFallback = function (name) {
    return require(name)
}

const defaultSourceMapInstallScriptName = exports.defaultSourceMapInstallScriptName = path.resolve(__dirname, './runtime/source-map-install.js')

const saveCacheMap = function (filename, mapContent) {
    const io = require('io')
    const zip = require('zip')

    const stream = new io.MemoryStream();
    const zipfile = zip.open(stream, "w");
    zipfile.write(new Buffer(mapContent), 'index.map');
    zipfile.close();

    stream.rewind();
    fs.setZipFS(`${filename}.zip`, stream.readAll());
}

const LINE_MARKER = '//# sourceMappingURL=';
exports.registerTsCompiler = (
    sandbox,
    tsCompilerOptions = exports.getCwdTsCompilerOptions(),
    moduleOptions = {},
    sourceMapConfig
) => {
    const {
        sourceMapInstallScriptFilename = defaultSourceMapInstallScriptName,
        sourceMapInstallScript = ''
    } = sourceMapConfig || {}

    moduleOptions.compilerOptions = util.extend({}, tsCompilerOptions, moduleOptions.compilerOptions)

    CORE._filterCompilerOptions(moduleOptions.compilerOptions)

    if (moduleOptions.compilerOptions.inlineSourceMap) {
        // sandbox.setModuleCompiler(SOURCEMAP_SUFFIX, buf => buf + '')
        if (sourceMapInstallScript)
            sandbox.add('source-map-install.js', sourceMapInstallScript)
        else if (sourceMapInstallScriptFilename && fs.exists(sourceMapInstallScriptFilename))
            sandbox.require(sourceMapInstallScriptFilename, __dirname)
    }

    ;[
        TS_SUFFIX,
        '.tsx'
    ].forEach(tsSuffix => {
        sandbox.setModuleCompiler(tsSuffix, (buf, args) => {
            const compiledModule = compileCallback(buf, args, moduleOptions)

            if (moduleOptions.compilerOptions.inlineSourceMap) {
                const sourceMapURL = compiledModule.outputText.slice(
                    compiledModule.outputText.lastIndexOf(LINE_MARKER), -1
                )
                saveCacheMap(args.filename, LINE_MARKER + sourceMapURL)
                // sandbox.add(args.filename + SOURCEMAP_SUFFIX, sourceMapURL)
            }

            return compiledModule.outputText
        })
    })
}

exports.fixTsRaw = function (tsRaw) {
    if (typeof tsRaw !== 'string')
        throw 'tsRaw must be string!'

    if (tsRaw.length > 2 && tsRaw.indexOf('#!') === 0) {
        tsRaw = '//' + tsRaw;
    }

    return tsRaw
}

exports.replaceExtname = function (target = '', {
    to_replace = /.tsx?$/i,
    replace_to = '.js'
} = {}) {
    if (!target) return target

    if (to_replace === 'string')
        to_replace = new RegExp(`${to_replace}$`)

    return target.replace(to_replace, replace_to)
}

exports.NOOP = function noop () {}

exports.checkFilepathStat = function checkFilepathStat (filepath) {
    if (!fs.exists(filepath))
        throw new TSFError(`invalid filepath ${filepath}`, TSFError.LITERALS.NOT_EXISTED)

    const stat = fs.stat(filepath)
    if (!stat.isFile())
        throw new TSFError(`path '${filepath}' is not one file`, TSFError.LITERALS.NOT_FILE)

    return stat
}

exports.checkDirnameStat = function checkFilepathStat (filepath) {
    if (!fs.exists(filepath))
        throw new TSFError(`invalid filepath ${filepath}`, TSFError.LITERALS.NOT_EXISTED)

    const stat = fs.stat(filepath)
    if (!stat.isDirectory())
        throw new TSFError(`path '${filepath}' is not one directory`, TSFError.LITERALS.NOT_DIR)

    return stat
}

/**
 * @param allowedFSType
 *  - none(default): allow it not existed
 *  - file: allow it file
 *  - directory: allow it directory
 *  - symlink: allow it symlink
 * 
 * @throw throw exception if filepathOrStat is not allowed file type
 * @return return 0/stat when valid
 */
exports.checkFSStat = function checkFSStat (filepath, allowedFSType = 'file') {
    if (!filepath || typeof filepath !== 'string')
        throw new TSFError(`empty filepath ${filepath}`, TSFError.LITERALS.INVALID_FILEPATH)

    if (!fs.exists(filepath))
        throw new TSFError(`invalid filepath ${filepath}`, TSFError.LITERALS.NOT_EXISTED)

    const stat = fs.stat(filepath)

    switch (allowedFSType) {
        case 'file':
            if (!stat.isFile())
                throw new TSFError(`${UTILs.getLogPrefix('api', 'checkFSStat')}path '${targetpath}' is not file.`, TSFError.LITERALS.NOT_FILE)
            break
        case 'directory':
            if (!stat.isDirectory())
                throw new TSFError(`${UTILs.getLogPrefix('api', 'checkFSStat')}path '${targetpath}' is not directory.`, TSFError.LITERALS.NOT_DIR)
            break
        case 'symlink':
            if (!stat.isSymbolicLink())
                throw new TSFError(`${UTILs.getLogPrefix('api', 'checkFSStat')}path '${targetpath}' is not symbollink.`, TSFError.LITERALS.NOT_SYMLINK)
            break
    }

    return stat
}