import { op } from '../ops.js';

export default {
    id: 'cocktail',
    label: 'Cocktail Shaker Sort',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
    pseudocode: [
        'lo = 0; hi = n-1; swapped = true',
        'while swapped',
        '  swapped = false',
        '  for i = lo to hi-1',
        '    if a[i] > a[i+1]: swap; swapped = true',
        '  hi = hi - 1',
        '  for i = hi down to lo+1',
        '    if a[i] < a[i-1]: swap; swapped = true',
        '  lo = lo + 1',
    ],
    *run(a) {
        let lo = 0, hi = a.length - 1, swapped = true;
        yield op.line(1);
        while (swapped) {
            yield op.line(2);
            swapped = false;
            yield op.line(3);
            for (let i = lo; i < hi; i++) {
                yield op.line(4);
                yield op.compare(i, i + 1);
                yield op.line(5);
                if (a[i] > a[i + 1]) {
                    [a[i], a[i + 1]] = [a[i + 1], a[i]];
                    yield op.swap(i, i + 1);
                    swapped = true;
                }
            }
            hi--;
            yield op.line(6);
            for (let i = hi; i > lo; i--) {
                yield op.line(7);
                yield op.compare(i, i - 1);
                yield op.line(8);
                if (a[i] < a[i - 1]) {
                    [a[i], a[i - 1]] = [a[i - 1], a[i]];
                    yield op.swap(i, i - 1);
                    swapped = true;
                }
            }
            lo++;
            yield op.line(9);
        }
    },
};
