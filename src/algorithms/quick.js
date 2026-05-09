import { op } from '../ops.js';

export default {
    id: 'quick',
    label: 'Quick Sort',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', stable: false },
    pseudocode: [
        'qs(lo, hi):',
        '  if lo >= hi: return',
        '  pivot = a[hi]',
        '  i = lo',
        '  for j = lo to hi-1',
        '    if a[j] < pivot: swap a[i], a[j]; i++',
        '  swap a[i], a[hi]',
        '  qs(lo, i-1); qs(i+1, hi)',
    ],
    *run(a) {
        function* qs(lo, hi) {
            yield op.line(1);
            if (lo >= hi) { yield op.line(2); return; }
            yield op.range(lo, hi, 'quick');
            const pivot = a[hi];
            yield op.line(3);
            yield op.mark(hi, 'pivot');
            let i = lo;
            yield op.line(4);
            for (let j = lo; j < hi; j++) {
                yield op.line(5);
                yield op.compare(j, hi);
                if (a[j] < pivot) {
                    yield op.line(6);
                    if (i !== j) {
                        [a[i], a[j]] = [a[j], a[i]];
                        yield op.swap(i, j);
                    }
                    i++;
                }
            }
            yield op.line(7);
            if (i !== hi) {
                [a[i], a[hi]] = [a[hi], a[i]];
                yield op.swap(i, hi);
            }
            yield op.unmark(hi, 'pivot');
            yield op.rangeOff('quick');
            yield op.line(8);
            yield* qs(lo, i - 1);
            yield* qs(i + 1, hi);
        }
        yield* qs(0, a.length - 1);
    },
};
