const test = require('test')
test.setup()

const TSF = require('../')

describe("Sample", function () {
    it("Basic", function () {
        assert.isObject(TSF)
        
        assert.isObject(TSF.compilers)
    });
})

require('./specs/spec.from-memory');

test.run(console.DEBUG)