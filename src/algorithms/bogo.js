import { op } from '../ops.js';

/**
 * Bogo sort — joke entry. Iteration cap so the visualizer doesn't run
 * forever; on cap, gives up and just sorts. Useful only for very small N.
 */
const ITERATION_CAP = 5_000;

export default {
    id: 'bogo',
    label: 'Bogo Sort (capped)',
    complexity: { best: 'O(n)', average: 'O((n+1)!)', worst: '∞', space: 'O(1)', stable: false },
    pseudocode: [
        'iter = 0',
        'while not isSorted(a) and iter < CAP',
        '  Fisher-Yates shuffle a in place',
        '  iter = iter + 1',
        'if not isSorted(a)',
        '  insertion-sort a',
    ],
    *run(a) {
        let iter = 0;
        yield op.line(1);
        while (!isSorted(a) && iter < ITERATION_CAP) {
            yield op.line(2);
            yield op.line(3);
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                if (i !== j) {
                    [a[i], a[j]] = [a[j], a[i]];
                    yield op.swap(i, j);
                }
            }
            iter++;
            yield op.line(4);
        }
        yield op.line(5);
        if (!isSorted(a)) {
            yield op.line(6);
            for (let i = 1; i < a.length; i++) {
                const key = a[i];
                let j = i - 1;
                while (j >= 0 && a[j] > key) {
                    yield op.compare(j, i);
                    a[j + 1] = a[j];
                    yield op.write(j + 1, a[j + 1]);
                    j--;
                }
                a[j + 1] = key;
                yield op.write(j + 1, key);
            }
        }
    },
};

function isSorted(a) {
    for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
    return true;
}
