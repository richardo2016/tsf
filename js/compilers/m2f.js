const fs = require('fs')
const path = require('path')

const UTILs = require('../_utils')
const TSFError = require('../error')

const { compile } = require('./memory')

exports.memoryToFile = function (tsRaw = '', targetpath = '', tsCompilerOptions, options) {
    const { overwrite = false } = options || {};

    try {
        const tstat = UTILs.checkFilepathStat(targetpath)
    
        if (tstat.isFile() && !overwrite)
            throw new TSFError(`${UTILs.getLogPrefix('api', 'memoryToFile')}file '${targetpath}' has existed.`, TSFError.LITERALS.FILE_EXISTED)

        if (tstat.isDirectory())
            throw new TSFError(`${UTILs.getLogPrefix('api', 'memoryToFile')}directory '${targetpath}' has existed, you cannot overwrite it.`, TSFError.LITERALS.DIR_EXISTED)
    } catch (error) {}

    const tbasedir = path.dirname(targetpath)
    try {
        UTILs.checkDirnameStat(tbasedir)
    } catch (error) {
        if (error.literalCode !== TSFError.LITERALS.NOT_EXISTED)
            throw error

        try {
            UTILs.mkdirp(tbasedir)
        } catch (e) {
            throw new TSFError(e.message, TSFError.LITERALS.MKDIR_FAILED)
        }
    }

    fs.writeTextFile(targetpath, compile(tsRaw, tsCompilerOptions))
}