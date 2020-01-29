const fs = require('fs')
const path = require('path')

const UTILs = require('../_utils')
const TSFError = require('../error')

const { transpileTypescript } = require('./memory')

exports.memoryToFile = function (tsRaw = '', targetpath = '', tsCompilerOptions, options) {
    const { overwrite = false } = options || {};

    try {
        tstat = UTILs.checkFSStat(targetpath, 'file')
        if (!overwrite)
            throw new TSFError(`target path ${targetpath} existed`, TSFError.LITERALS.FILE_EXISTED)
    } catch (error) {
        if (error.literalCode !== TSFError.LITERALS.NOT_EXISTED)
            throw error
    }

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

    fs.writeTextFile(targetpath, transpileTypescript(tsRaw, tsCompilerOptions, options))
}