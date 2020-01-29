const test = require('test');
test.setup();

const vm = require('vm')
const fs = require('fs')
const path = require('path')

const rmdirr = require('@fibjs/rmdirr')

const TSF = require('../../')

const rawTest = {
    input: `
export function add (a: number, b: number) {
    return a + b
}

export function http () {
    return 'http'
}

export function hello () {
    return 'hello, world'
}
`,
    sboxName: 'from-memory'
}

odescribe('from-memory', () => {
    let sbox
    function resetSbox () {
        sbox = new vm.SandBox({})
    }

    beforeEach(() => {
        resetSbox()
    })

    before(() => {
        rmdirr(path.resolve(__dirname, './dist/from-memory'))
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

    it('@module', () => {
        assert.isFunction(TSF.compilers.compileFrom)
        assert.isFunction(TSF.compilers.compileFrom)
    });

    it('compile', () => {
        const jsscript = TSF.compilers.compileFrom(rawTest.input)
        assert.isString(jsscript)

        sbox.addScript(rawTest.sboxName, new Buffer(jsscript))

        const rawModule = sbox.require(rawTest.sboxName, __dirname)
        assertSandboxForBasicTs(rawModule)
    })

    it('@error: compile empty input', () => {
        assert.throws(() => {
            TSF.compilers.compileFrom()
        })

        try {
            TSF.compilers.compileFrom()
        } catch (error) {
            assert.equal(error.literalCode, TSF.Error.LITERALS.TYPESCRIPT_SOURCE_EMPTY)
        }
    })

    it('compile to file', () => {
        const target = path.resolve(__dirname, './dist/from-memory/compileToFile.js')
        TSF.compilers.compileFromTo(rawTest.input, target)
        assert.equal(fs.exists(target), true)

        const rawModule = sbox.require(target, __dirname)
        assertSandboxForBasicTs(rawModule)
    })
})

require.main === module && test.run(console.DEBUG)
