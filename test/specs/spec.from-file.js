const test = require('test');
test.setup();

const vm = require('vm')

const path = require('path')
const rmdirr = require('@fibjs/rmdirr')
const mkdirp = require('@fibjs/mkdirp')

const strip = require('strip-color')

const TSF = require('../../')

const { SOURCE_BASE } = require('./_helpers')

const fsFileTestBasic = {
    inputFilepath: path.resolve(SOURCE_BASE, './basic.ts'),
    outputFilepath: path.join(__dirname, './dist/from-file/1/basic.js'),
    outputDirname: path.join(__dirname, './dist/from-file/2'),
    sboxName: 'file'
}
const fsFileTestInterface = {
    inputFilepath: path.resolve(SOURCE_BASE, './interface.ts')
}

odescribe('from file', () => {
    let sbox
    function resetSbox () {
        sbox = new vm.SandBox({})
    }

    beforeEach(() => {
        resetSbox()
    })

    before(() => {
        rmdirr(path.resolve(path.join(__dirname, './dist/from-file')))
    })

    function assertSandboxForBasicTs (rawModule) {
        assert.isObject(rawModule)
        assert.isFunction(rawModule.add)
        assert.isFunction(rawModule.http)
        assert.equal(rawModule.http(), 'http')
        assert.isFunction(rawModule.add)
        assert.equal(rawModule.add(1, 2), 3)

        assert.isFunction(rawModule.hello)
        assert.isFunction(rawModule.hello)
        assert.equal(rawModule.hello(), 'hello, world')
    }

    it('@error: comile file to file, target required', () => {
        assert.throws(() => {
            TSF.compilers.compileFromTo(fsFileTestBasic.inputFilepath)
        })

        try {
            TSF.compilers.compileFromTo(fsFileTestBasic.inputFilepath)
        } catch (error) {
            assert.equal(error.literalCode, TSF.Error.LITERALS.INVALID_FILEPATH)
        }
    })

    it('compile file to file', () => {
        TSF.compilers.compileFromTo(
            fsFileTestBasic.inputFilepath,
            fsFileTestBasic.outputFilepath,
            { overwrite: true }
        )

        assertSandboxForBasicTs(
            sbox.require(fsFileTestBasic.outputFilepath, __dirname)
        )
    })

    it('@error: compile file to file, dont overwrite', () => {
        TSF.compilers.compileFromTo(
            fsFileTestBasic.inputFilepath,
            fsFileTestBasic.outputFilepath,
            { overwrite: true }
        )
        
        assert.throws(() => {
            TSF.compilers.compileFromTo(
                fsFileTestBasic.inputFilepath,
                fsFileTestBasic.outputFilepath,
                { overwrite: false }
            )
        })

        try {
            TSF.compilers.compileFromTo(
                fsFileTestBasic.inputFilepath,
                fsFileTestBasic.outputFilepath,
                { overwrite: false }
            )
        } catch (error) {
            assert.equal(error.literalCode, TSF.Error.LITERALS.TARGET_FILE_EXISTED)
        }
    })

    it('compile: interface', () => {
        const rawScript = TSF.compilers.compileFrom(fsFileTestInterface.inputFilepath)
        assert.isString(rawScript)

        const rawModule = TSF.compilers.compileFrom(fsFileTestInterface.inputFilepath, { toModule: true })

        assert.isObject(rawModule)
        assert.isFunction(rawModule.doFoo)
        assert.equal(rawModule.doFoo({
            foo1: '1',
            bar: 2,
            bar1: 3
        }), '123')
        assert.equal(isNaN(
            rawModule.doFoo({})
        ), true)
    })

    it('compile file into to directory', () => {
        rmdirr(fsFileTestBasic.outputDirname)
        mkdirp(fsFileTestBasic.outputDirname)

        TSF.compilers.compileFromTo(
            fsFileTestBasic.inputFilepath,
            fsFileTestBasic.outputDirname,
            { overwrite: false }
        )

        assertSandboxForBasicTs(
            sbox.require(path.resolve(fsFileTestBasic.outputDirname, './basic.js'), __dirname)
        )
    })

    odescribe('@diagnostics', () => {
        ;[
            'diagnostics/wrong_syntax1.1.ts',
            'diagnostics/wrong_syntax1.2.ts',
            'diagnostics/wrong_syntax1.3.ts',
            'diagnostics/wrong_syntax1.4.ts',

            // 'diagnostics/type_error.1.ts',
        ].forEach((filename) => {
            it(`${filename}`, () => {
                const source = path.resolve(__dirname, `./src/${filename}`)
                const diagnostics = []
                // collect diagnostics
                TSF.compilers.compileFrom(source, { diagnostics })

                assert.isTrue(!!diagnostics.length)
                
                assert.isTrue(
                    diagnostics.every(diagnostic => {
                        const output = TSF.tsApis.formatDiagnostic(diagnostic);
                        console.log('output', output)
                        // console.log(
                        //     'TSF.tsApis.simplifyDiagnostic(diagnostic)',
                        //     TSF.tsApis.simplifyDiagnostic(diagnostic)
                        // );

                        return (
                            strip(output).includes(
                                `test/specs/src/${filename}`
                            )
                        ) && (
                            strip(output).includes(
                                `TS${diagnostic.code}: ${diagnostic.messageText}`
                            )
                        )
                    })
                )
            })
        });
    })
})

require.main === module && test.run(console.DEBUG)