import { op } from '../ops.js';

export default {
    id: 'shell',
    label: 'Shell Sort',
    complexity: { best: 'O(n log n)', average: 'O(n^1.25)', worst: 'O(n²)', space: 'O(1)', stable: false },
    pseudocode: [
        'for gap = n/2 down to 1, gap /= 2',
        '  for i = gap to n-1',
        '    tmp = a[i]; j = i',
        '    while j >= gap and a[j-gap] > tmp',
        '      a[j] = a[j-gap]',
        '      j = j - gap',
        '    a[j] = tmp',
    ],
    *run(a) {
        for (let gap = a.length >> 1; gap > 0; gap >>= 1) {
            yield op.line(1);
            for (let i = gap; i < a.length; i++) {
                yield op.line(2);
                const tmp = a[i];
                yield op.line(3);
                yield op.read(i);
                let j = i;
                while (j >= gap) {
                    yield op.line(4);
                    yield op.compare(j - gap, i);
                    if (a[j - gap] <= tmp) break;
                    a[j] = a[j - gap];
                    yield op.line(5);
                    yield op.write(j, a[j]);
                    j -= gap;
                    yield op.line(6);
                }
                if (j !== i) {
                    a[j] = tmp;
                    yield op.line(7);
                    yield op.write(j, tmp);
                }
            }
        }
    },
};
