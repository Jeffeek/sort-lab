import { op } from '../ops.js';

export default {
    id: 'counting',
    label: 'Counting Sort',
    complexity: { best: 'O(n+k)', average: 'O(n+k)', worst: 'O(n+k)', space: 'O(k)', stable: true },
    pseudocode: [
        'scan a to find min, max',
        'k = max - min + 1',
        'count[0..k-1] = 0',
        'for i = 0 to n-1',
        '  count[a[i] - min] += 1',
        'idx = 0',
        'for v = 0 to k-1',
        '  while count[v] > 0',
        '    a[idx++] = v + min',
        '    count[v] -= 1',
    ],
    *run(a) {
        const n = a.length;
        if (n === 0) return;
        let max = a[0], min = a[0];
        yield op.line(1);
        for (let i = 1; i < n; i++) {
            yield op.read(i);
            if (a[i] > max) max = a[i];
            if (a[i] < min) min = a[i];
        }
        const k = max - min + 1;
        yield op.line(2);
        const count = new Array(k).fill(0);
        yield op.line(3);
        yield op.line(4);
        for (let i = 0; i < n; i++) {
            yield op.read(i);
            yield op.line(5);
            count[a[i] - min]++;
        }
        let idx = 0;
        yield op.line(6);
        for (let v = 0; v < k; v++) {
            yield op.line(7);
            while (count[v] > 0) {
                yield op.line(8);
                a[idx] = v + min;
                yield op.line(9);
                yield op.write(idx, a[idx]);
                idx++;
                yield op.line(10);
                count[v]--;
            }
        }
    },
};
