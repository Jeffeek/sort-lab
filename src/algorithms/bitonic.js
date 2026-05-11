import { op } from '../ops.js';

/**
 * Bitonic sort. Native size is a power of two; for arbitrary lengths we sort
 * an internal padded buffer with +∞ sentinels and emit ops only for in-range
 * indices, then a final settle pass writes the result back. The lattice
 * pattern is fully visible at power-of-two sizes; for other sizes the trace
 * is partial but the final output is correct.
 */
export default {
    id: 'bitonic',
    label: 'Bitonic Sort',
    complexity: { best: 'O(log²n)', average: 'O(n log²n)', worst: 'O(n log²n)', space: 'O(n)', stable: false },
    pseudocode: [
        'pad n up to power of two with +∞ sentinels',
        'bitonicSort(lo, cnt, dir):',
        '  if cnt <= 1: return',
        '  bitonicSort(lo,       cnt/2, ascending)',
        '  bitonicSort(lo+cnt/2, cnt/2, descending)',
        '  bitonicMerge(lo, cnt, dir)',
        'bitonicMerge(lo, cnt, dir):',
        '  for i = lo to lo+cnt/2-1',
        '    compareSwap(i, i + cnt/2, dir)',
        '  recurse on each half',
        'settle: copy padded[0..n-1] back into a',
    ],
    *run(a) {
        const n = a.length;
        if (n < 2) return;
        let pow = 1; while (pow < n) pow <<= 1;

        const SENTINEL = Number.MAX_SAFE_INTEGER;
        const padded = new Array(pow);
        yield op.line(1);
        for (let i = 0; i < n; i++) padded[i] = a[i];
        for (let i = n; i < pow; i++) padded[i] = SENTINEL;

        function* compareSwap(i, j, dir) {
            yield op.line(9);
            const shouldSwap =
                (dir === 1 && padded[i] > padded[j]) ||
                (dir === 0 && padded[i] < padded[j]);
            if (i < n && j < n) {
                yield op.compare(i, j);
                if (shouldSwap) {
                    [padded[i], padded[j]] = [padded[j], padded[i]];
                    yield op.swap(i, j);
                }
            } else if (shouldSwap) {
                [padded[i], padded[j]] = [padded[j], padded[i]];
            }
        }
        function* bitonicMerge(lo, cnt, dir) {
            yield op.line(7);
            if (cnt <= 1) return;
            const k = cnt >> 1;
            yield op.line(8);
            for (let i = lo; i < lo + k; i++) yield* compareSwap(i, i + k, dir);
            yield op.line(10);
            yield* bitonicMerge(lo, k, dir);
            yield* bitonicMerge(lo + k, k, dir);
        }
        function* bitonicSort(lo, cnt, dir) {
            yield op.line(2);
            if (cnt <= 1) { yield op.line(3); return; }
            const k = cnt >> 1;
            yield op.line(4);
            yield* bitonicSort(lo, k, 1);
            yield op.line(5);
            yield* bitonicSort(lo + k, k, 0);
            yield op.line(6);
            yield* bitonicMerge(lo, cnt, dir);
        }
        yield* bitonicSort(0, pow, 1);

        // Sentinel-paired swaps mutate padded silently (no op emitted), so for
        // non-power-of-two n the Player's value model can diverge from padded.
        // Settle unconditionally: the previous `if (a[i] !== padded[i])` guard
        // was unsafe because original[i] occasionally equals sorted[i] by
        // coincidence and skipped a needed reconciliation write.
        yield op.line(11);
        for (let i = 0; i < n; i++) {
            a[i] = padded[i];
            yield op.write(i, padded[i]);
        }
    },
};
