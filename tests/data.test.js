import { describe, it, expect } from 'vitest';
import {
    mulberry32, generateArray, isSorted,
    DISTRIBUTIONS, DISTRIBUTION_LABELS,
} from '../src/data.js';

describe('mulberry32', () => {
    it('is deterministic for the same seed', () => {
        const a = mulberry32(42);
        const b = mulberry32(42);
        for (let i = 0; i < 32; i++) expect(a()).toBe(b());
    });

    it('returns values in [0, 1)', () => {
        const r = mulberry32(7);
        for (let i = 0; i < 1000; i++) {
            const v = r();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });

    it('diverges for different seeds', () => {
        const a = mulberry32(1)();
        const b = mulberry32(2)();
        expect(a).not.toBe(b);
    });
});

describe('isSorted', () => {
    it('is true for empty and singleton arrays', () => {
        expect(isSorted([])).toBe(true);
        expect(isSorted([9])).toBe(true);
    });

    it('is true for ascending and constant arrays', () => {
        expect(isSorted([1, 2, 3, 4, 5])).toBe(true);
        expect(isSorted([2, 2, 2])).toBe(true);
    });

    it('is false when any descending pair exists', () => {
        expect(isSorted([1, 3, 2])).toBe(false);
        expect(isSorted([5, 4, 3, 2, 1])).toBe(false);
    });
});

describe('generateArray', () => {
    it('returns the requested length', () => {
        for (const dist of DISTRIBUTIONS) {
            const { values } = generateArray(50, dist, 123);
            expect(values).toHaveLength(50);
        }
    });

    it('is deterministic for a given seed', () => {
        for (const dist of DISTRIBUTIONS) {
            const a = generateArray(40, dist, 999).values;
            const b = generateArray(40, dist, 999).values;
            expect(a).toEqual(b);
        }
    });

    it('echoes the provided seed in the result', () => {
        expect(generateArray(10, 'random', 12345).seed).toBe(12345);
    });

    it('synthesizes a seed when none is provided', () => {
        const { seed } = generateArray(10, 'random');
        expect(Number.isFinite(seed)).toBe(true);
        expect(seed).toBeGreaterThanOrEqual(0);
    });

    it('reversed is strictly descending and a permutation of 1..n', () => {
        const { values } = generateArray(20, 'reversed', 1);
        expect(values[0]).toBe(20);
        expect(values[values.length - 1]).toBe(1);
        expect([...values].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    });

    it('random is a permutation of 1..n and rarely already sorted', () => {
        const { values } = generateArray(40, 'random', 7);
        expect([...values].sort((a, b) => a - b)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
        expect(isSorted(values)).toBe(false);
    });

    it('nearlySorted preserves the multiset 1..n', () => {
        const { values } = generateArray(50, 'nearlySorted', 5);
        expect([...values].sort((a, b) => a - b)).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
    });

    it('fewUnique produces at most a handful of distinct values', () => {
        const { values } = generateArray(200, 'fewUnique', 9);
        const distinct = new Set(values);
        expect(distinct.size).toBeLessThanOrEqual(5);
    });

    it('sawtooth values stay within [1, n]', () => {
        const { values } = generateArray(100, 'sawtooth', 3);
        for (const v of values) {
            expect(v).toBeGreaterThanOrEqual(1);
            expect(v).toBeLessThanOrEqual(100);
        }
    });

    it('gaussian clamps to [1, n]', () => {
        const { values } = generateArray(150, 'gaussian', 11);
        for (const v of values) {
            expect(v).toBeGreaterThanOrEqual(1);
            expect(v).toBeLessThanOrEqual(150);
        }
    });
});

describe('DISTRIBUTION_LABELS', () => {
    it('has a human label for every DISTRIBUTIONS entry', () => {
        for (const d of DISTRIBUTIONS) {
            expect(typeof DISTRIBUTION_LABELS[d]).toBe('string');
            expect(DISTRIBUTION_LABELS[d].length).toBeGreaterThan(0);
        }
    });
});
