const test = require('test')
test.setup()

const Mod = require('../')

describe("Sample", function () {
    it("Basic", function () {
        assert.equal(Mod, null)
    });
})
test.run(console.DEBUG)