let _nege_counter = 0;
let _pos_counter = 0;
const CODES = {
    INVALID_CODE: --_nege_counter,
    UNKNOWN: --_nege_counter,
    DEBUG: --_nege_counter,

    NOT_EXISTED: ++_pos_counter,
    NOT_FILE: ++_pos_counter,
    NOT_DIR: ++_pos_counter,

    MKDIR_FAILED: ++_pos_counter,

    TYPESCRIPT_SOURCE_EMPTY: ++_pos_counter,

    INVALID_FILEPATH: ++_pos_counter,
    INVALID_BASENAME: ++_pos_counter,

    FILE_EXISTED: ++_pos_counter,
    DIR_EXISTED: ++_pos_counter,
    SYMLINK_EXISTED: ++_pos_counter,

    TARGET_FILE_EXISTED: ++_pos_counter,
    FILE_CONTENT_EMPTY: ++_pos_counter,

    TS_DIAGNOTICS_INFO: ++_pos_counter,

    TYPE_ASSERT: ++_pos_counter,
};
_pos_counter = _nege_counter = 0;

const LITERALS = Object.keys(CODES).reduce((prev, cur) => { prev[cur] = cur; return prev; }, {});

const TSFError = module.exports = class TSFError extends Error {
    constructor(message, literalCode, extras) {
        super(message);

        dft: {
            this.name = 'TSFError';

            /**
             * error logprefix
             * @enum common: common error
             * @enum compiler: error occured when compilation
             */
            this.logprefix = 'common';
            this.message = message;
            this.code = 0;
        }

        Error.call(this);
        Error.captureStackTrace(this, this.constructor);

        if (!literalCode || !LITERALS[literalCode])
            throw new TSFError(`Invalid error code: ${code}`, LITERALS.INVALID_CODE);
        
        if (extras && typeof extras === 'object') {
            for (let k in extras) {
                if (this.hasOwnProperty(k))
                    this[k] = extras[k];
            }
        }
        
        this.code = CODES[literalCode];
        this.literalCode = literalCode;
    }

    toString() {
        return `[TSFError://${this.literalCode}/${this.logprefix}] ${this.message}`;
    }
}

TSFError.LITERALS = LITERALS;