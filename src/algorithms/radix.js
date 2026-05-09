import { op } from '../ops.js';

export default {
    id: 'radix',
    label: 'Radix Sort (LSD, base 10)',
    complexity: { best: 'O(nk)', average: 'O(nk)', worst: 'O(nk)', space: 'O(n+k)', stable: true },
    pseudocode: [
        'find max value to determine digit count',
        'for each digit (LSD first):',
        '  bucket each a[i] by its current digit',
        '  flatten buckets back into a',
    ],
    *run(a) {
        const n = a.length;
        if (n === 0) return;
        let max = a[0];
        for (let i = 1; i < n; i++) {
            yield op.read(i);
            if (a[i] > max) max = a[i];
        }
        for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
            const buckets = Array.from({ length: 10 }, () => []);
            for (let i = 0; i < n; i++) {
                yield op.read(i);
                const d = Math.floor(a[i] / exp) % 10;
                buckets[d].push(a[i]);
            }
            let k = 0;
            for (let d = 0; d < 10; d++) {
                for (const v of buckets[d]) {
                    a[k] = v;
                    yield op.write(k, v);
                    k++;
                }
            }
        }
    },
};
