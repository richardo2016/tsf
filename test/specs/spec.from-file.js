const test = require('test');
test.setup();

const vm = require('vm')

const fs = require('fs')
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

describe('from file', () => {
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

    describe('tsx', () => {
        const compilerOptionsJsx = {
            target: 'es6',
            module: 'commonjs',
            jsx: "react"
        }

        const outputDirname = path.join(__dirname, './dist/from-file/jsx');

        const sandbox = new vm.SandBox({
            'react': {},
            'react-native': {},
            'preact': {},
        })

        ;[
            {
                description: 'compile tsx(fragment)',

                inputFilepath: path.resolve(SOURCE_BASE, './tsx/fragment.tsx'),
                outputFilepath: path.resolve(__dirname, './dist/from-file/jsx/fragment.js'),
                
                jsx: 'React',
                jsxFactory: 'React.createElement'
            },
            {
                description: 'compile tsx',

                inputFilepath: path.resolve(SOURCE_BASE, './tsx/html.div.tsx'),
                outputFilepath: path.resolve(__dirname, './dist/from-file/jsx/html.div.js'),
                
                jsx: 'React',
                jsxFactory: 'React.createElement'
            },
            {
                description: 'compile tsx(preact)',

                inputFilepath: path.resolve(SOURCE_BASE, './tsx/html.div.tsx'),
                outputFilepath: path.resolve(__dirname, './dist/from-file/jsx/html.div.preact.js'),
                
                jsx: 'preserve',
                jsxFactory: 'preact.createElement'
            },
            {
                description: 'compile tsx(h)',

                inputFilepath: path.resolve(SOURCE_BASE, './tsx/html.div.tsx'),
                outputFilepath: path.resolve(__dirname, './dist/from-file/jsx/html.div.h.js'),
                
                jsx: 'preserve',
                jsxFactory: 'h'
            },
            {
                description: 'compile tsx(h)',

                inputFilepath: path.resolve(SOURCE_BASE, './tsx/native.tsx'),
                outputFilepath: path.resolve(__dirname, './dist/from-file/jsx/native.js'),
                
                jsx: 'react-native',
                jsxFactory: 'h'
            },
        ].forEach(({ description, inputFilepath, outputFilepath, jsxFactory }) => {
            it(`${description}`, () => {
                const jsscript = TSF.compilers.compileFrom(inputFilepath, { compilerOptions: {...compilerOptionsJsx, jsxFactory} })
    
                assert.ok( jsscript.includes(`${jsxFactory}`))
            })


            it(`[toModule]${description}`, () => {
                const rawModule = TSF.compilers.compileFrom(inputFilepath, { sandbox, toModule: true, compilerOptions: {...compilerOptionsJsx, jsxFactory} })
    
                assert.isFunction( rawModule.default )
            })

            it(`${description} to target`, () => {
                try { rmdirr(outputFilepath) } catch (error) {}

                assert.isFalse(fs.exists(outputFilepath))
    
                TSF.compilers.compileFromTo(inputFilepath, outputFilepath, { compilerOptions: {...compilerOptionsJsx, jsxFactory} })
    
                assert.isTrue(fs.exists(outputFilepath))
                assert.ok( fs.readTextFile(outputFilepath).includes(`${jsxFactory}`))
            })
        });
    })

    describe('@diagnostics', () => {
        ;[
            'diagnostics/wrong_syntax1.1.ts',
            'diagnostics/wrong_syntax1.2.ts',
            'diagnostics/wrong_syntax1.3.ts',
            'diagnostics/wrong_syntax1.4.ts',

            'diagnostics/type_error.1.ts',
            'diagnostics/type_error.2.ts',
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
                        // console.log('\t', output)

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
