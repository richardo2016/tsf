const UTILS = require('../_utils')

const { transpileTypescript } = require('./memory');
const { memoryToFile } = require('./m2f');
const { compileFileTo } = require('./f2f');
const { compileFile } = require('./f2m')

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
 */
exports.compileFromTo = function (source, target, options) {    
    const {
        compilerOptions = {},
        ...restOpts
    } = options || {}

    restOpts.toModule = false

    try {
        UTILS.checkFilepathStat(source)
    } catch (error) {  
        return memoryToFile(source, target, compilerOptions, restOpts)
    }

    return compileFileTo(source, target, compilerOptions, restOpts)
}