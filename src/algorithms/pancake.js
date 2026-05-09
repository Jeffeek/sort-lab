import { op } from '../ops.js';

/**
 * Pancake sort: at each step, find the max in [0..size), flip it to the front,
 * then flip [0..size) so the max lands at the end. Visually striking due to
 * prefix reversals.
 */
export default {
    id: 'pancake',
    label: 'Pancake Sort',
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false },
    pseudocode: [
        'for size = n down to 2',
        '  maxIdx = 0',
        '  for i = 1 to size-1',
        '    if a[i] > a[maxIdx]: maxIdx = i',
        '  if maxIdx != size-1',
        '    if maxIdx != 0: flip(maxIdx)',
        '    flip(size-1)',
    ],
    *run(a) {
        function* flip(end) {
            let i = 0, j = end;
            while (i < j) {
                [a[i], a[j]] = [a[j], a[i]];
                yield op.swap(i, j);
                i++; j--;
            }
        }
        for (let size = a.length; size > 1; size--) {
            yield op.line(1);
            yield op.range(0, size - 1, 'pancake');
            let maxIdx = 0;
            yield op.line(2);
            for (let i = 1; i < size; i++) {
                yield op.line(3);
                yield op.compare(i, maxIdx);
                yield op.line(4);
                if (a[i] > a[maxIdx]) maxIdx = i;
            }
            yield op.line(5);
            if (maxIdx !== size - 1) {
                yield op.line(6);
                if (maxIdx !== 0) yield* flip(maxIdx);
                yield op.line(7);
                yield* flip(size - 1);
            }
            yield op.rangeOff('pancake');
        }
    },
};
