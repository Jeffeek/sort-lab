import { op } from '../ops.js';

export default {
    id: 'bubble',
    label: 'Bubble Sort',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
    pseudocode: [
        'for i = 0 to n-2',
        '  swapped = false',
        '  for j = 0 to n-i-2',
        '    if a[j] > a[j+1]',
        '      swap a[j], a[j+1]',
        '      swapped = true',
        '  if not swapped break',
    ],
    *run(a) {
        for (let i = 0; i < a.length - 1; i++) {
            yield op.line(1);
            let swapped = false;
            yield op.line(2);
            for (let j = 0; j < a.length - i - 1; j++) {
                yield op.line(3);
                yield op.compare(j, j + 1);
                yield op.line(4);
                if (a[j] > a[j + 1]) {
                    [a[j], a[j + 1]] = [a[j + 1], a[j]];
                    yield op.line(5);
                    yield op.swap(j, j + 1);
                    swapped = true;
                }
            }
            yield op.line(7);
            if (!swapped) break;
        }
    },
};
