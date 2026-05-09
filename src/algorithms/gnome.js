import { op } from '../ops.js';

export default {
    id: 'gnome',
    label: 'Gnome Sort',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)', stable: true },
    pseudocode: [
        'i = 0',
        'while i < n',
        '  if i == 0 or a[i-1] <= a[i]',
        '    i = i + 1',
        '  else',
        '    swap a[i], a[i-1]',
        '    i = i - 1',
    ],
    *run(a) {
        let i = 0;
        yield op.line(1);
        while (i < a.length) {
            yield op.line(2);
            if (i === 0) {
                yield op.line(3);
                yield op.line(4);
                i++;
                continue;
            }
            yield op.line(3);
            yield op.compare(i - 1, i);
            if (a[i] >= a[i - 1]) {
                yield op.line(4);
                i++;
            } else {
                yield op.line(5);
                yield op.line(6);
                [a[i], a[i - 1]] = [a[i - 1], a[i]];
                yield op.swap(i, i - 1);
                yield op.line(7);
                i--;
            }
        }
    },
};
