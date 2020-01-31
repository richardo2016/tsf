const path = require('path')

const mkdirp = require('@fibjs/mkdirp')
const readdirr = require('@fibjs/fs-readdir-recursive')

const mm = require('micromatch')

const UTILS = require('../_utils')
const { arraify } = require('../utils/array')
const TSFError = require('../error')

const { compileFileTo } = require('./f2f')

const DFLT_GLOB_RULE = ['**/*']
const DFLT_MM_OPTIONS_FOR_RELNAME = {
    dot: true,
    basename: false
}
exports.directoryToDirectory = function (sourceDir, targetDir, compilerOptions, options) {
    UTILS.checkFSStat(sourceDir, 'directory')
    try {
        UTILS.checkFSStat(targetDir, 'directory')
    } catch (error) {
        if (error.literalCode !== TSFError.LITERALS.NOT_EXISTED)
            throw error

        mkdirp(targetDir)
    }

    const {
        isTsScript = UTILS.getFilenameFilter(_INCLUDE_EXTS, _EXCLUDE_EXTS),
        /**
         * whether overwrite existed target files, or copy some non-ts files
         * @type { boolean | Array<string> } bool value or file glob rules
         */
        keepFiles = false,
        ...restOptions
    } = options || {}

    const blobNameList = readdirr(
        sourceDir,
        (filename) => filename
    )

    const onTravelToNonTsFile = getCallackTravalOnNonTsFiles(
        arraify(keepFiles === true ? DFLT_GLOB_RULE : keepFiles).filter(x => typeof x === 'string')
    )

    blobNameList.forEach((relname) => {
        const fullpath = path.resolve(sourceDir, relname)
        const basename = path.basename(fullpath)

        if (!isTsScript(relname))
            return onTravelToNonTsFile({
                sourceDir,
                targetDir,
                basename,
                relname,
                filename: fullpath
            })

        const trelname = UTILS.replaceExtname(relname)
        const tpath = path.join(targetDir, trelname)

        compileFileTo(fullpath, tpath, compilerOptions, restOptions)
    })
}

const _INCLUDE_EXTS = ['.ts', '.tsx']
const _EXCLUDE_EXTS = ['.d.ts']

function getCallackTravalOnNonTsFiles (globRules = [], mm_options) {
    return function _handler ({
        targetDir, relname, filename
    }) {
        const [_filename] = mm([relname], globRules, { ...DFLT_MM_OPTIONS_FOR_RELNAME, ...mm_options })

        if (_filename)
            UTILS.copyFileTo(filename, path.resolve(targetDir, relname), { overwrite: true })
    }
}