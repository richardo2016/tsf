const path = require('path')

const mkdirp = require('@fibjs/mkdirp')

const UTILs = require('../_utils')
const TSFError = require('../error')

const { transpileTypescript } = require('./memory')

exports.memoryToFile = function (tsRaw = '', targetpath = '', compilerOptions, _preTsfTranspileOptions) {
    const { overwrite = false, ...tsfTranspileOptions } = _preTsfTranspileOptions || {};

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
            mkdirp(tbasedir)
        } catch (e) {
            throw new TSFError(e.message, TSFError.LITERALS.MKDIR_FAILED)
        }
    }
    
    if (_preTsfTranspileOptions.fileName || ['.map', '.d.ts'].some(ext => path.extname(targetpath) === ext))
        transpileTypescript(tsRaw, {...compilerOptions, outDir: path.dirname(targetpath)}, {
            ...tsfTranspileOptions,
            writeTarget: 'IO',
        })
    else if (path.basename(targetpath) !== path.basename(_preTsfTranspileOptions.fileName))
        UTILs.writeToFile(
            transpileTypescript(tsRaw, compilerOptions, {
                ...tsfTranspileOptions,
                writeTarget: 'MEMORY',
            }),
            targetpath,
            { overwrite: true }
        )
}