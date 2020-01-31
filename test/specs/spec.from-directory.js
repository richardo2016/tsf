const test = require('test');
test.setup();

const fs = require('fs')
const path = require('path')

const rmdirr = require('@fibjs/rmdirr')

const TSF = require('../../')
const { SOURCE_BASE } = require('./_helpers')

const compilerOptions1 = {
    target: 'es6',
    module: 'commonjs'
}
const compilerOptions2 = {
    target: 'es5',
    module: 'commonjs'
}
const compilerOptionsJsx = {
    target: 'es6',
    module: 'commonjs',
    jsx: "react"
}

const TARGET_PATH = path.resolve(__dirname, './dist/from-directory')

describe('fs-directory', () => {
    before(() => {
        try { rmdirr(TARGET_PATH) } catch (error) {}
        try { fs.unlink(TARGET_PATH) } catch (error) {}
    })

    it('compile directory to', () => {
        assert.isFalse(fs.exists(path.resolve(TARGET_PATH, './simple')))
        
        const baseDir = path.resolve(SOURCE_BASE, './dirs/simple')
        const distDir = path.resolve(TARGET_PATH, './simple')

        TSF.compilers.compileFromTo(baseDir, distDir)
        assert.isTrue(fs.exists(path.resolve(TARGET_PATH, './simple')))
        assert.isTrue(fs.exists(path.resolve(TARGET_PATH, './simple/index.js')))
    })

    it('compile directory to with compilerOptions1', () => {
        assert.isFalse(fs.exists(path.resolve(TARGET_PATH, './simple-with-compilerOptions1')))

        const baseDir = path.resolve(SOURCE_BASE, './dirs/simple')
        const distDir = path.resolve(TARGET_PATH, './simple-with-compilerOptions1')

        TSF.compilers.compileFromTo(baseDir, distDir, { compilerOptions: compilerOptions1 })

        assert.isTrue(fs.exists(path.resolve(TARGET_PATH, './simple-with-compilerOptions1/index.js')))
    })

    it('compile directory to with compilerOptions2', () => {
        assert.isFalse(fs.exists(path.resolve(TARGET_PATH, './simple-with-compilerOptions2')))

        const baseDir = path.resolve(SOURCE_BASE, './dirs/simple')
        const distDir = path.resolve(TARGET_PATH, './simple-with-compilerOptions2')

        TSF.compilers.compileFromTo(baseDir, distDir, { compilerOptions: compilerOptions2 })

        assert.isTrue(fs.exists(path.resolve(TARGET_PATH, './simple-with-compilerOptions2/index.js')))
    })

    describe('compile directory to with compilerOptionsJsx', () => {
        it('default', () => {
            const baseDir = path.resolve(SOURCE_BASE, './tsx')
            const distDir = path.resolve(TARGET_PATH, './directory-jsx')

            TSF.compilers.compileFromTo(baseDir, distDir, { compilerOptions: compilerOptionsJsx })

            assert.isTrue( fs.exists(path.resolve(distDir, 'html.div.js')) )
            assert.isTrue( fs.readTextFile(path.resolve(distDir, 'html.div.js')).includes(`React.createElement`))
            assert.isFalse( fs.exists(path.resolve(distDir, 'html.div.jsx')) )

            assert.isTrue( fs.exists(path.resolve(distDir, 'fragment.js')) )
            assert.isTrue( fs.readTextFile(path.resolve(distDir, 'fragment.js')).includes(`React.createElement(React.Fragment`))
        })

        it('jsxFactory: "React.createElement"', () => {
            const baseDir = path.resolve(SOURCE_BASE, './tsx')
            const distDir = path.resolve(TARGET_PATH, './directory-jsx1')

            TSF.compilers.compileFromTo(baseDir, distDir, { compilerOptions: {...compilerOptionsJsx, jsxFactory: 'React.createElement'} })

            assert.isTrue( fs.exists(path.resolve(distDir, 'fragment.js')) )
            assert.isTrue( fs.readTextFile(path.resolve(distDir, 'fragment.js')).includes(`React.createElement(React.Fragment`))
        })
    })

    describe('test copy', () => {
        const baseDirForCopy = path.resolve(SOURCE_BASE, './dirs/test_copy')

        it('compile directory without any typescript files', () => {
            const targetDirForCopy = path.resolve(TARGET_PATH, './test_copy-default')
    
            TSF.compilers.compileFromTo(baseDirForCopy, targetDirForCopy, {})
            assert.isFalse( fs.exists(path.resolve(targetDirForCopy, '1.txt')) )
            assert.isFalse( fs.exists(path.resolve(targetDirForCopy, '2.json')) )
            assert.isFalse( fs.exists(path.resolve(targetDirForCopy, '3.makefile')) )
            assert.isFalse( fs.exists(path.resolve(targetDirForCopy, '4.cpp')) )
            assert.isFalse( fs.exists(path.resolve(targetDirForCopy, 'glob_to_include')) )
            assert.isFalse( fs.exists(path.resolve(targetDirForCopy, 'glob_to_exclude123')) )
        })

        it('compile directory without any typescript files: with exclude', () => {
            const targetDirForCopy = path.resolve(TARGET_PATH, './test_copy-exclude')
    
            TSF.compilers.compileFromTo(baseDirForCopy, targetDirForCopy, {keepFiles: ['!*exclude*']})
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, '1.txt')) )
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, '2.json')) )
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, '3.makefile')) )
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, '4.cpp')) )
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, 'glob_to_include')) )
            assert.isFalse( fs.exists(path.resolve(targetDirForCopy, 'glob_to_exclude123')) )
        })

        it('compile directory without any typescript files: copy all', () => {
            const targetDirForCopy = path.resolve(TARGET_PATH, './test_copy-all')
    
            TSF.compilers.compileFromTo(baseDirForCopy, targetDirForCopy, {keepFiles: true})
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, '1.txt')) )
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, '2.json')) )
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, '3.makefile')) )
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, '4.cpp')) )
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, 'glob_to_include')) )
            assert.isTrue( fs.exists(path.resolve(targetDirForCopy, 'glob_to_exclude123')) )
        })

        describe('compile directory to with other files: customized_copy', () => {
            const customizedCopyDir = path.resolve(TARGET_PATH, './test_copy-globrules')

            ;[
                {
                    globs: ['*', '!node_modules/**/*', 'glob_to_include/*', '!glob_to_exclude*'],
                    assertion: (idx) => {
                        assert.isTrue( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '1.txt')) )
                        assert.isTrue( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '2.json')) )
                        assert.isTrue( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '3.makefile')) )
                        assert.isTrue( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '4.cpp')) )

                        assert.isTrue( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, 'glob_to_include')) )
                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, 'glob_to_exclude123')) )
                    }
                },
                {
                    globs: ['!node_modules/**/*', 'glob_to_include/*', '!glob_to_exclude*'],
                    assertion: (idx) => {
                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '1.txt')) )
                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '2.json')) )
                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '3.makefile')) )
                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '4.cpp')) )

                        assert.isTrue( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, 'glob_to_include')) )
                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, 'glob_to_exclude123')) )
                    }
                },
                {
                    globs: ['glob_to_exclude*'],
                    assertion: (idx) => {
                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '1.txt')) )
                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '2.json')) )
                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '3.makefile')) )
                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, '4.cpp')) )

                        assert.isFalse( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, 'glob_to_include')) )
                        assert.isTrue( fs.exists(path.resolve(`${customizedCopyDir}${idx}`, 'glob_to_exclude123')) )
                    }
                }
            ].forEach(({ globs, assertion }, idx) => {
                idx = idx + 1

                it(`[${idx}] globs: ${globs.join(', ')}`, () => {
                    TSF.compilers.compileFromTo(baseDirForCopy, `${customizedCopyDir}${idx}`, { keepFiles: globs })

                    assertion.apply(null, [idx])
                })
            })
        })
    })
})

require.main === module && test.run(console.DEBUG)
