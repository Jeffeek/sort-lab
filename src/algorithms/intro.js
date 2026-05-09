import { op } from '../ops.js';

/**
 * Intro sort — quicksort with a recursion-depth cap; falls back to heapsort
 * when the cap is exceeded, switching to insertion sort below a threshold.
 * Mirrors what std::sort does in libstdc++.
 */
const INSERTION_THRESHOLD = 16;

export default {
    id: 'intro',
    label: 'Intro Sort',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(log n)', stable: false },
    pseudocode: [
        'introsort(lo, hi, depth):',
        '  while hi - lo > 16',
        '    if depth == 0: heapsort(lo, hi); return',
        '    depth = depth - 1',
        '    p = partition(lo, hi)',
        '    introsort(p+1, hi, depth)',
        '    hi = p - 1',
        '  insertion-sort(lo, hi)',
    ],
    *run(a) {
        const depthLimit = 2 * Math.floor(Math.log2(Math.max(2, a.length)));
        yield* introsort(a, 0, a.length - 1, depthLimit);
    },
};

function* introsort(a, lo, hi, depth) {
    yield op.line(1);
    while (hi - lo > INSERTION_THRESHOLD) {
        yield op.line(2);
        if (depth === 0) {
            yield op.line(3);
            yield* heapsortRange(a, lo, hi);
            return;
        }
        yield op.line(4);
        depth--;
        yield op.line(5);
        const p = yield* partition(a, lo, hi);
        yield op.line(6);
        yield* introsort(a, p + 1, hi, depth);
        yield op.line(7);
        hi = p - 1;
    }
    yield op.line(8);
    yield* insertionRange(a, lo, hi);
}

function* partition(a, lo, hi) {
    const pivot = a[hi];
    yield op.mark(hi, 'pivot');
    let i = lo;
    for (let j = lo; j < hi; j++) {
        yield op.compare(j, hi);
        if (a[j] < pivot) {
            if (i !== j) {
                [a[i], a[j]] = [a[j], a[i]];
                yield op.swap(i, j);
            }
            i++;
        }
    }
    if (i !== hi) {
        [a[i], a[hi]] = [a[hi], a[i]];
        yield op.swap(i, hi);
    }
    yield op.unmark(hi, 'pivot');
    return i;
}

function* insertionRange(a, lo, hi) {
    for (let i = lo + 1; i <= hi; i++) {
        const key = a[i];
        let j = i - 1;
        while (j >= lo) {
            yield op.compare(j, i);
            if (a[j] <= key) break;
            a[j + 1] = a[j];
            yield op.write(j + 1, a[j + 1]);
            j--;
        }
        a[j + 1] = key;
        yield op.write(j + 1, key);
    }
}

function* heapsortRange(a, lo, hi) {
    const len = hi - lo + 1;
    function* siftDown(start, end) {
        let root = start;
        while (true) {
            const l = 2 * (root - lo) + 1 + lo;
            const r = l + 1;
            if (l > end) return;
            let max = root;
            yield op.compare(l, max);
            if (a[l] > a[max]) max = l;
            if (r <= end) {
                yield op.compare(r, max);
                if (a[r] > a[max]) max = r;
            }
            if (max === root) return;
            [a[root], a[max]] = [a[max], a[root]];
            yield op.swap(root, max);
            root = max;
        }
    }
    for (let i = lo + (len >> 1) - 1; i >= lo; i--) yield* siftDown(i, hi);
    for (let end = hi; end > lo; end--) {
        [a[lo], a[end]] = [a[end], a[lo]];
        yield op.swap(lo, end);
        yield* siftDown(lo, end - 1);
    }
}
