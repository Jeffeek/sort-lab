import { op } from '../ops.js';

/**
 * Tim sort — pedagogical variant: insertion sort runs of fixed size, then
 * iteratively merge them. Production tim sort detects natural runs and uses
 * adaptive run-stack invariants; we omit those here to keep the trace
 * approachable while preserving the run-and-merge structure.
 */
const RUN = 32;

export default {
    id: 'tim',
    label: 'Tim Sort (simplified)',
    complexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true },
    pseudocode: [
        'RUN = 32',
        'for start = 0 to n-1 step RUN',
        '  insertion-sort a[start .. min(start+RUN, n)-1]',
        'for size = RUN; size < n; size *= 2',
        '  for lo = 0 to n-1 step size*2',
        '    mid = min(lo + size - 1, n-1)',
        '    hi  = min(lo + size*2 - 1, n-1)',
        '    if mid < hi: merge a[lo..mid] with a[mid+1..hi]',
    ],
    *run(a) {
        const n = a.length;
        yield op.line(1);
        for (let start = 0; start < n; start += RUN) {
            yield op.line(2);
            const end = Math.min(start + RUN, n);
            yield op.range(start, end - 1, 'tim-run');
            yield op.line(3);
            for (let i = start + 1; i < end; i++) {
                const key = a[i];
                let j = i - 1;
                while (j >= start) {
                    yield op.compare(j, i);
                    if (a[j] <= key) break;
                    a[j + 1] = a[j];
                    yield op.write(j + 1, a[j + 1]);
                    j--;
                }
                a[j + 1] = key;
                yield op.write(j + 1, key);
            }
            yield op.rangeOff('tim-run');
        }

        const aux = new Array(n);
        for (let size = RUN; size < n; size *= 2) {
            yield op.line(4);
            for (let lo = 0; lo < n; lo += size * 2) {
                yield op.line(5);
                const mid = Math.min(lo + size - 1, n - 1);
                yield op.line(6);
                const hi = Math.min(lo + size * 2 - 1, n - 1);
                yield op.line(7);
                if (mid >= hi) continue;
                yield op.line(8);
                yield op.range(lo, hi, 'tim-merge');
                for (let k = lo; k <= hi; k++) aux[k] = a[k];
                let i = lo, j = mid + 1;
                for (let k = lo; k <= hi; k++) {
                    if      (i > mid) a[k] = aux[j++];
                    else if (j > hi)  a[k] = aux[i++];
                    else {
                        yield op.compare(i, j);
                        if (aux[j] < aux[i]) a[k] = aux[j++];
                        else                 a[k] = aux[i++];
                    }
                    yield op.write(k, a[k]);
                }
                yield op.rangeOff('tim-merge');
            }
        }
    },
};
