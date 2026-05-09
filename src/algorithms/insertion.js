import { op } from '../ops.js';

export default {
    id: 'insertion',
    label: 'Insertion Sort',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
    pseudocode: [
        'for i = 1 to n-1',
        '  key = a[i]',
        '  j = i - 1',
        '  while j >= 0 and a[j] > key',
        '    a[j+1] = a[j]',
        '    j = j - 1',
        '  a[j+1] = key',
    ],
    *run(a) {
        for (let i = 1; i < a.length; i++) {
            yield op.line(1);
            const key = a[i];
            yield op.line(2);
            yield op.read(i);
            let j = i - 1;
            yield op.line(3);
            while (j >= 0) {
                yield op.line(4);
                yield op.compare(j, i);
                if (a[j] <= key) break;
                a[j + 1] = a[j];
                yield op.line(5);
                yield op.write(j + 1, a[j + 1]);
                j--;
                yield op.line(6);
            }
            a[j + 1] = key;
            yield op.line(7);
            yield op.write(j + 1, key);
        }
    },
};
