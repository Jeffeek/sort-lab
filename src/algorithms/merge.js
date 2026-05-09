import { op } from '../ops.js';

export default {
    id: 'merge',
    label: 'Merge Sort',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', stable: true },
    pseudocode: [
        'ms(lo, hi):',
        '  if lo >= hi: return',
        '  mid = (lo + hi) / 2',
        '  ms(lo, mid); ms(mid+1, hi)',
        '  merge(lo, mid, hi)',
        'merge: walk i, j and copy smallest into a[k]',
    ],
    *run(a) {
        const aux = a.slice();
        function* merge(lo, mid, hi) {
            yield op.range(lo, hi, 'merge');
            for (let k = lo; k <= hi; k++) aux[k] = a[k];
            let i = lo, j = mid + 1;
            for (let k = lo; k <= hi; k++) {
                yield op.line(6);
                if (i > mid) {
                    a[k] = aux[j++];
                } else if (j > hi) {
                    a[k] = aux[i++];
                } else {
                    yield op.compare(i, j);
                    if (aux[j] < aux[i]) a[k] = aux[j++];
                    else                 a[k] = aux[i++];
                }
                yield op.write(k, a[k]);
            }
            yield op.rangeOff('merge');
        }
        function* ms(lo, hi) {
            yield op.line(1);
            if (lo >= hi) { yield op.line(2); return; }
            const mid = (lo + hi) >> 1;
            yield op.line(3);
            yield op.line(4);
            yield* ms(lo, mid);
            yield* ms(mid + 1, hi);
            yield op.line(5);
            yield* merge(lo, mid, hi);
        }
        yield* ms(0, a.length - 1);
    },
};
