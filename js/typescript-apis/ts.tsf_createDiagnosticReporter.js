const { typescript } = require('./runtime')

/**
 * @see https://sourcegraph.com/github.com/microsoft/TypeScript@6769313/-/blob/src/compiler/watch.ts#L20
 * @ref ts.createDiagnosticReporter
 */
exports.config = (ts = typescript) => {
    const sysFormatDiagnosticsHost = ts.sys ? {
        getCurrentDirectory: function () { return ts.sys.getCurrentDirectory(); },
        getNewLine: function () { return ts.sys.newLine; },
        getCanonicalFileName: ts.createGetCanonicalFileName(ts.sys.useCaseSensitiveFileNames)
    } : undefined; // TODO: GH#18217

    function tsf_createDiagnosticReporter(system, pretty) {
        var host = system === ts.sys ? sysFormatDiagnosticsHost : {
            getCurrentDirectory: function () { return system.getCurrentDirectory(); },
            getNewLine: function () { return system.newLine; },
            getCanonicalFileName: ts.createGetCanonicalFileName(system.useCaseSensitiveFileNames),
        };
        if (!pretty) {
            return function (diagnostic) { return system.write(ts.formatDiagnostic(diagnostic, host)); };
        }
        var diagnostics = new Array(1);
        return function (diagnostic) {
            diagnostics[0] = diagnostic;
            const formattedOutput = ts.formatDiagnosticsWithColorAndContext(diagnostics, host) + host.getNewLine()
            diagnostics[0] = undefined; // TODO: GH#18217
            
            return formattedOutput;
        };
    }
    ts.tsf_createDiagnosticReporter = tsf_createDiagnosticReporter;
}