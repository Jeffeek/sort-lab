import { op } from '../ops.js';

export default {
    id: 'heap',
    label: 'Heap Sort',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', stable: false },
    pseudocode: [
        'build max-heap (siftDown from n/2-1 down to 0)',
        'for end = n-1 down to 1',
        '  swap a[0], a[end]',
        '  siftDown(0, end-1)',
    ],
    *run(a) {
        const n = a.length;

        function* siftDown(start, end) {
            let root = start;
            while (true) {
                const l = 2 * root + 1;
                const r = 2 * root + 2;
                if (l > end) return;
                let max = root;
                yield op.compare(l, max);
                if (a[l] > a[max]) max = l;
                if (r <= end) {
                    // Compare against the candidate fixed at this point in the trace.
                    yield op.compare(r, max);
                    if (a[r] > a[max]) max = r;
                }
                if (max === root) return;
                [a[root], a[max]] = [a[max], a[root]];
                yield op.swap(root, max);
                root = max;
            }
        }

        yield op.line(1);
        for (let i = (n >> 1) - 1; i >= 0; i--) yield* siftDown(i, n - 1);
        yield op.line(2);
        for (let end = n - 1; end > 0; end--) {
            [a[0], a[end]] = [a[end], a[0]];
            yield op.line(3);
            yield op.swap(0, end);
            yield op.line(4);
            yield* siftDown(0, end - 1);
        }
    },
};
