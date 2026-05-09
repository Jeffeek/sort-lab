# Counting Sort

Non-comparison sort. Three passes:

1. Find `min` and `max` to size the count array (`k = max - min + 1`).
2. Tally occurrences: `count[a[i] - min]++`.
3. Reconstruct `a` by walking `count` and emitting each value the recorded number of times.

Stable in its standard prefix-sum form, but this implementation reconstructs by repetition (not prefix-sum + reverse iteration), so stability is not preserved against equal-valued duplicate input objects — irrelevant here because values are integers being compared by identity.

Cost is O(n + k); pathological when `k >> n` (e.g. sparse large integers).

## Suggested pseudocode

```
1  scan a to find min, max
2  k = max - min + 1
3  count[0..k-1] = 0
4  for i = 0 to n-1
5    count[a[i] - min] += 1
6  idx = 0
7  for v = 0 to k-1
8    while count[v] > 0
9      a[idx++] = v + min
10     count[v] -= 1
```

## Wiring notes

- The first two passes are read-only (`op.read`); pair `op.line(1)` with the min/max scan and `op.line(4)`/`op.line(5)` with the tally loop.
- `op.line(8)`/`op.line(9)` inside the reconstruction loop. Each `op.write(idx, ...)` already drives the renderer.
- Dropdown label is "Counting Sort"; consider mentioning in pseudocode that this works on the integer values *as keys* — important for users wondering how it handles non-integer data (it doesn't).
