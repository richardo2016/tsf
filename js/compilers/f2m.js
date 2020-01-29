const fs = require('fs')

const CORE = require('../core')
const UTILs = require('../_utils')
const TSFError = require('../error')

exports.compileFile = function (filepath = '', tsCompilerOptions) {
    UTILs.checkFilepathStat(filepath)

    let tsRaw = fs.readTextFile(filepath)
    if (!tsRaw)
        throw new TSFError(`${UTILs.getLogPrefix('api', 'compileFile')}filecontent is empty in ${filepath}`, TSFError.LITERALS.DEBUG)

    return CORE._getTranspilor(tsCompilerOptions)(tsRaw)
}