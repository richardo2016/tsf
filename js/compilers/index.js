const UTILS = require('../_utils')

const { compile: compileTypescript } = require('./memory');
const { memoryToFile } = require('./m2f');
const { compileFileTo } = require('./f2f');

exports.compile = function (tssource, options) {
    if (!options)
        return compileTypescript(tssource)
}

/**
 * @description routings:
 *  1. compile EXISTED source file to target file(or dirname)
 *  2. compile typescript source to target file(or dirname)
 * 
 * @param source: typescript source, or file path of it.
 * @param target: target file path, MUST BE EXISTED
 */
exports.compileTo = function (source, target, options) {    
    try {
        UTILS.checkFilepathStat(sourcefile)
    } catch (error) {
        return memoryToFile(source, target)
    }

    return compileFileTo(source, target)
}