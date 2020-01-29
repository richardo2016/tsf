const fs = require('fs')
const path = require('path')

const UTILs = require('../_utils')
const TSFError = require('../error')

const { memoryToFile } = require('./m2f')

/**
 * @description compile one EXISTED file to target
 * 
 * @param sourcefile source file path, MUST be exsited and NOT EMPTY
 * @param targetpath target file path or dirname of it, it could be not existed be must one valid file path
 */
exports.compileFileTo = function (sourcefile = '', targetpath = '', tsCompilerOptions, options) {
    const { overwrite = false } = options || {};

    UTILS.checkFilepathStat(sourcefile)

    const tsRaw = fs.readTextFile(sourcefile)
    if (!tsRaw)
        throw new TSFError(`${UTILs.getLogPrefix('api', 'compileFileTo')}filecontent is empty in ${sourcefile}`, TSFError.LITERALS.FILE_CONTENT_EMPTY)

    try {
        UTILs.checkFilepathStat(targetpath)
        
        throw new TSFError(`target ${targetpath} existed!`, TSFError.LITERALS.FILE_EXISTED)
    } catch (error) {
        if (error.literalCode === TSFError.LITERALS.FILE_EXISTED && !overwrite) {
            throw error
        }

        if (error.literalCode === TSFError.LITERALS.NOT_FILE && fs.stat(targetpath).isDirectory()) {
            const sbasename = path.basename(sourcefile)
            targetpath = path.join(targetpath, sbasename)
        }
    }
    
    return memoryToFile(tsRaw, targetpath, tsCompilerOptions)
}