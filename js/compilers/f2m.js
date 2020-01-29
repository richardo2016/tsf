const fs = require('fs')

const { transpileTypescript } = require('./memory');

const UTILs = require('../_utils')
const TSFError = require('../error')

exports.compileFile = function (filepath = '', compilerOptions, options) {
    UTILs.checkFilepathStat(filepath)

    let tsRaw = fs.readTextFile(filepath)
    if (!tsRaw)
        throw new TSFError(`${UTILs.getLogPrefix('api', 'compileFile')}filecontent is empty in ${filepath}`, TSFError.LITERALS.FILE_CONTENT_EMPTY)

    return transpileTypescript([tsRaw, compilerOptions], options)
}