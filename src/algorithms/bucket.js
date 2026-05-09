import { op } from '../ops.js';

/**
 * Bucket sort with insertion sort within each bucket. Bucket count chosen as
 * sqrt(n) — the standard heuristic that balances bucket fill cost against
 * intra-bucket sort cost.
 */
export default {
    id: 'bucket',
    label: 'Bucket Sort',
    complexity: { best: 'O(n+k)', average: 'O(n+k)', worst: 'O(n²)', space: 'O(n+k)', stable: true },
    pseudocode: [
        'scan a to find max',
        'b = floor(sqrt(n)); buckets[0..b-1] = []',
        'for i = 0 to n-1',
        '  bi = min(b-1, floor((a[i]-1) / max * b))',
        '  buckets[bi].append(a[i])',
        'idx = 0',
        'for each bucket',
        '  insertion-sort bucket',
        '  copy bucket back into a starting at idx',
    ],
    *run(a) {
        const n = a.length;
        if (n === 0) return;
        let max = a[0];
        yield op.line(1);
        for (let i = 1; i < n; i++) {
            yield op.read(i);
            if (a[i] > max) max = a[i];
        }
        const bucketCount = Math.max(1, Math.floor(Math.sqrt(n)));
        yield op.line(2);
        const buckets = Array.from({ length: bucketCount }, () => []);
        yield op.line(3);
        for (let i = 0; i < n; i++) {
            yield op.read(i);
            yield op.line(4);
            const b = Math.min(bucketCount - 1, Math.floor((a[i] - 1) / max * bucketCount));
            yield op.line(5);
            buckets[b].push(a[i]);
        }
        let idx = 0;
        yield op.line(6);
        for (const bucket of buckets) {
            yield op.line(7);
            yield op.line(8);
            for (let i = 1; i < bucket.length; i++) {
                const key = bucket[i];
                let j = i - 1;
                while (j >= 0 && bucket[j] > key) { bucket[j + 1] = bucket[j]; j--; }
                bucket[j + 1] = key;
            }
            yield op.line(9);
            for (const v of bucket) {
                a[idx] = v;
                yield op.write(idx, v);
                idx++;
            }
        }
    },
};
