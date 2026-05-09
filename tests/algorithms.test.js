/**
 * Generator-correctness suite. Verifies every registered algorithm produces a
 * sorted array preserving the input multiset. Matrix is intentionally small —
 * one happy seed per (algorithm, distribution) at two representative sizes —
 * because the contract under test is "does the generator end with a sorted
 * array", not exhaustive fuzzing.
 */
import { describe, it, expect } from 'vitest';
import '../src/algorithms/index.js';
import { Algorithms } from '../src/registry.js';
import { generateArray, isSorted, DISTRIBUTIONS } from '../src/data.js';

const SEED = 12345;

// Bogo's expected runtime is factorial. Restrict it to a tiny size; everyone
// else gets a representative pair (small + medium).
const SIZES_BY_ALGO = {
    bogo: [6],
    default: [16, 96],
};

for (const algo of Algorithms.list()) {
    const sizes = SIZES_BY_ALGO[algo.id] || SIZES_BY_ALGO.default;

    describe(algo.label, () => {
        for (const dist of DISTRIBUTIONS) {
            for (const size of sizes) {
                it(`sorts ${dist} n=${size}`, () => {
                    const { values } = generateArray(size, dist, SEED);
                    const a = values.slice();
                    for (const _ of algo.run(a)) { /* drain */ }
                    expect(isSorted(a)).toBe(true);
                    expect(a.slice().sort((x, y) => x - y))
                        .toEqual(values.slice().sort((x, y) => x - y));
                });
            }
        }
    });
}
