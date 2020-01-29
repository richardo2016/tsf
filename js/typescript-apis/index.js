const { diagnosticsReporter } = require('./runtime');

exports.formatDiagnostic = (diagnostic) => {
    return diagnosticsReporter(diagnostic)
}

/**
 * @experimental
 * @unstable
 */
exports.simplifyDiagnostic = function (diag) {
    return ({
        $$keys: Object.keys(diag),
        // file: diag.file,
        // $$fileKeys: Object.keys(diag.file),
        fileInfo: {
            fileName: diag.file.fileName,
        },
        start: diag.start,
        length: diag.length,
        messageText: diag.messageText,
        code: diag.code,
        category: diag.category
    })
}

exports.summarize = function (diagnostic) {

}