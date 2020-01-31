/// <reference types="@fibjs/types" />
/// <reference types="typescript" />

import ts = require("typescript")

declare namespace TSFNamespace {
    interface ExportModule {

    }

    interface TsfTranspileOptions extends ts.TranspileOptions {
        tsfOptions: {
            writeTarget: 'memory' | 'io'
        }
    }
}

declare module "@fibjs/tsf" {
    const mod: TSFNamespace.ExportModule
    export = mod
}
