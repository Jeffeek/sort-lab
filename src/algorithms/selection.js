import { op } from '../ops.js';

export default {
    id: 'selection',
    label: 'Selection Sort',
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: false },
    pseudocode: [
        'for i = 0 to n-2',
        '  min = i',
        '  for j = i+1 to n-1',
        '    if a[j] < a[min]: min = j',
        '  if min != i: swap a[i], a[min]',
    ],
    *run(a) {
        for (let i = 0; i < a.length - 1; i++) {
            yield op.line(1);
            let min = i;
            yield op.line(2);
            yield op.mark(i, 'cursor');
            for (let j = i + 1; j < a.length; j++) {
                yield op.line(3);
                yield op.compare(j, min);
                if (a[j] < a[min]) {
                    if (min !== i) yield op.unmark(min, 'cursor');
                    yield op.line(4);
                    min = j;
                    yield op.mark(min, 'cursor');
                }
            }
            yield op.line(5);
            if (min !== i) {
                [a[i], a[min]] = [a[min], a[i]];
                yield op.swap(i, min);
            }
            yield op.unmark(i, 'cursor');
            if (min !== i) yield op.unmark(min, 'cursor');
        }
    },
};
