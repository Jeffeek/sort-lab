import { op } from '../ops.js';

export default {
    id: 'comb',
    label: 'Comb Sort',
    complexity: { best: 'O(n log n)', average: 'Ω(n²/2^p)', worst: 'O(n²)', space: 'O(1)', stable: false },
    pseudocode: [
        'gap = n; sorted = false',
        'while not sorted',
        '  gap = max(1, floor(gap / 1.3))',
        '  sorted = (gap == 1)',
        '  for i = 0 to n-gap-1',
        '    if a[i] > a[i+gap]',
        '      swap a[i], a[i+gap]',
        '      sorted = false',
    ],
    *run(a) {
        const shrink = 1.3;
        let gap = a.length;
        let sorted = false;
        yield op.line(1);
        while (!sorted) {
            yield op.line(2);
            gap = Math.max(1, Math.floor(gap / shrink));
            yield op.line(3);
            sorted = gap === 1;
            yield op.line(4);
            for (let i = 0; i + gap < a.length; i++) {
                yield op.line(5);
                yield op.compare(i, i + gap);
                yield op.line(6);
                if (a[i] > a[i + gap]) {
                    [a[i], a[i + gap]] = [a[i + gap], a[i]];
                    yield op.line(7);
                    yield op.swap(i, i + gap);
                    yield op.line(8);
                    sorted = false;
                }
            }
        }
    },
};
