/// <reference types="@fibjs/types" />

declare namespace FibAppStarterNS {
    interface ExportModule {

    }
}

declare module "@fibjs/tsf" {
    const mod: FibAppStarterNS.ExportModule
    export = mod
}
