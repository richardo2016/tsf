const UTILS = require('../_utils')

const TSFError = require('../error')

const { transpileTypescript } = require('./memory');
const { memoryToFile } = require('./m2f');
const { compileFileTo } = require('./f2f');
const { compileFile } = require('./f2m')
const { directoryToDirectory } = require('./d2d')

exports.compileFrom = function (source, options) {    
    const {
        compilerOptions = {},
        ...restOptions
    } = options || {}

    try {
        UTILS.checkFilepathStat(source)
    } catch (error) {
        return transpileTypescript(source, compilerOptions, restOptions)
    }

    return compileFile(source, compilerOptions, restOptions)
}

/**
 * @description routings:
 *  1. compile EXISTED source file to target file(or dirname)
 *  2. compile typescript source to target file(or dirname)
 * 
 * @param source: typescript source, or file path of it.
 * @param target: target file path, MUST BE EXISTED
 * 
 * @return void
 */
exports.compileFromTo = function (source, target, options) {    
    const {
        compilerOptions = {},
        ...restOpts
    } = options || {}

    restOpts.toModule = false

    try {
        UTILS.checkFSStat(source, 'directory')
        return directoryToDirectory(source, target, compilerOptions, restOpts)
    } catch (error) {
        switch (error.literalCode) {
            default:
                throw error
            case TSFError.LITERALS.NOT_EXISTED:
            case TSFError.LITERALS.NOT_DIR:
                break
        }
    }

    try {
        UTILS.checkFSStat(source, 'file')
        return compileFileTo(source, target, compilerOptions, restOpts)
        
    } catch (error) {
        switch (error.literalCode) {
            default:
                throw error
            case TSFError.LITERALS.NOT_EXISTED:
            case TSFError.LITERALS.NOT_FILE:
                break
        }
    }

    return memoryToFile(source, target, compilerOptions, restOpts)
}