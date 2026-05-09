/**
 * Operation vocabulary — the contract between algorithms and renderers.
 *
 * Algorithms are pure generators that yield Operations against an indexed
 * collection. They never touch the DOM, audio, or stats directly: those
 * concerns are owned by the Player and Renderer that consume the operation
 * stream.
 *
 * @typedef {Object} CompareOp   @property {'compare'}   type @property {number} i @property {number} j
 * @typedef {Object} SwapOp      @property {'swap'}      type @property {number} i @property {number} j
 * @typedef {Object} ReadOp      @property {'read'}      type @property {number} i
 * @typedef {Object} WriteOp     @property {'write'}     type @property {number} i @property {number} value
 * @typedef {Object} MarkOp      @property {'mark'}      type @property {number[]} indices @property {string} class
 * @typedef {Object} UnmarkOp    @property {'unmark'}    type @property {number[]} indices @property {string} [class]
 * @typedef {Object} RangeOp     @property {'range'}     type @property {string} [id] @property {number} [lo] @property {number} [hi]
 * @typedef {Object} LineOp      @property {'line'}      type @property {number} n
 *
 * @typedef {CompareOp|SwapOp|ReadOp|WriteOp|MarkOp|UnmarkOp|RangeOp|LineOp} Operation
 */

export const Op = Object.freeze({
    COMPARE: 'compare',
    SWAP:    'swap',
    READ:    'read',
    WRITE:   'write',
    MARK:    'mark',
    UNMARK:  'unmark',
    RANGE:   'range',
    LINE:    'line',
});

export const op = {
    compare:  (i, j)              => ({ type: Op.COMPARE, i, j }),
    swap:     (i, j)              => ({ type: Op.SWAP,    i, j }),
    read:     (i)      => ({ type: Op.READ,    i }),
    write:    (i, value)          => ({ type: Op.WRITE,   i, value }),
    mark:     (indices, klass)    => ({ type: Op.MARK,    indices: [].concat(indices), class: klass }),
    unmark:   (indices, klass)    => ({ type: Op.UNMARK,  indices: [].concat(indices), class: klass }),
    range:    (lo, hi, id = 'main') => ({ type: Op.RANGE, id, lo, hi }),
    rangeOff: (id = 'main')=> ({ type: Op.RANGE,   id, lo: null, hi: null }),
    line:     (n)     => ({ type: Op.LINE,    n }),
};

export const VISUAL_OP_TYPES = new Set([Op.COMPARE, Op.SWAP, Op.WRITE, Op.READ]);
