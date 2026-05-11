import { describe, it, expect } from 'vitest';
import { Op, op, VISUAL_OP_TYPES } from '../src/ops.js';

describe('Op enum', () => {
    it('is frozen', () => {
        expect(Object.isFrozen(Op)).toBe(true);
    });

    it('covers every op factory', () => {
        const factoryTypes = new Set(Object.keys(op).map(k => {
            // op.rangeOff also produces RANGE; map names → produced types via a probe call
            const probe = op[k].length === 0 ? op[k]() : op[k](0, 0);
            return probe.type;
        }));
        for (const v of Object.values(Op)) expect(factoryTypes.has(v)).toBe(true);
    });
});

describe('op factories', () => {
    it('compare produces {type, i, j}', () => {
        expect(op.compare(2, 5)).toEqual({ type: 'compare', i: 2, j: 5 });
    });

    it('swap produces {type, i, j}', () => {
        expect(op.swap(0, 1)).toEqual({ type: 'swap', i: 0, j: 1 });
    });

    it('read produces {type, i}', () => {
        expect(op.read(3)).toEqual({ type: 'read', i: 3 });
    });

    it('write produces {type, i, value}', () => {
        expect(op.write(4, 99)).toEqual({ type: 'write', i: 4, value: 99 });
    });

    it('mark coerces a scalar index into an array', () => {
        expect(op.mark(7, 'pivot')).toEqual({ type: 'mark', indices: [7], class: 'pivot' });
    });

    it('mark accepts an array of indices unchanged', () => {
        expect(op.mark([1, 2, 3], 'cursor')).toEqual({
            type: 'mark', indices: [1, 2, 3], class: 'cursor',
        });
    });

    it('unmark mirrors mark and allows omitting class', () => {
        expect(op.unmark([4, 5])).toEqual({ type: 'unmark', indices: [4, 5], class: undefined });
    });

    it('range carries lo/hi and a default id', () => {
        expect(op.range(2, 9)).toEqual({ type: 'range', id: 'main', lo: 2, hi: 9 });
        expect(op.range(0, 1, 'lhs')).toEqual({ type: 'range', id: 'lhs', lo: 0, hi: 1 });
    });

    it('rangeOff nulls lo/hi to clear the range', () => {
        expect(op.rangeOff()).toEqual({ type: 'range', id: 'main', lo: null, hi: null });
        expect(op.rangeOff('rhs')).toEqual({ type: 'range', id: 'rhs', lo: null, hi: null });
    });

    it('line carries the 1-indexed pseudocode line number', () => {
        expect(op.line(7)).toEqual({ type: 'line', n: 7 });
    });
});

describe('VISUAL_OP_TYPES', () => {
    it('includes compare, swap, read, write', () => {
        expect(VISUAL_OP_TYPES.has(Op.COMPARE)).toBe(true);
        expect(VISUAL_OP_TYPES.has(Op.SWAP)).toBe(true);
        expect(VISUAL_OP_TYPES.has(Op.READ)).toBe(true);
        expect(VISUAL_OP_TYPES.has(Op.WRITE)).toBe(true);
    });

    it('excludes non-visual op types (mark/unmark/range/line)', () => {
        expect(VISUAL_OP_TYPES.has(Op.MARK)).toBe(false);
        expect(VISUAL_OP_TYPES.has(Op.UNMARK)).toBe(false);
        expect(VISUAL_OP_TYPES.has(Op.RANGE)).toBe(false);
        expect(VISUAL_OP_TYPES.has(Op.LINE)).toBe(false);
    });
});
