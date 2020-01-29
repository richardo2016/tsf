const typescript = require('typescript')
const ts = typescript

// require('./ts.sys').configTsSys(typescript);
require('./ts.tsf_createDiagnosticReporter').config(typescript);

exports.diagnosticsReporter = ts.tsf_createDiagnosticReporter(ts.sys, true);