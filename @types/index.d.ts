/// <reference types="@fibjs/types" />

declare namespace FibAppStarterNS {
    interface ExportModule {

    }
}

declare module "@anoymous/app" {
    const mod: FibAppStarterNS.ExportModule
    export = mod
}
