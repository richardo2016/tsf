const test = require('test')
test.setup()

const TSF = require('../')

describe("TSF", function () {
    it("Basic", function () {
        assert.isObject(TSF)
        
        assert.isObject(TSF.compilers)
    });
})

require('./specs/spec.from-memory');
require('./specs/spec.from-file');

test.run(console.DEBUG)