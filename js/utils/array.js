exports.dedupe = function (list = []) {
    if (!Array.isArray(list))
        throw new Error(`[dedupe] input must be array!`)

    return Array.from(new Set(list))
}

exports.arraify = function (list) {
    return Array.isArray(list) ? list : [list]
}