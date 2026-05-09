# Shell Sort

Generalization of insertion sort that pre-sorts elements `gap` apart before shrinking `gap` toward 1. Final pass with `gap = 1` is a plain insertion sort, but it runs on an array that's already mostly ordered, so the total work drops below O(n²).

The current implementation uses `gap = n/2, n/4, … 1` (Shell's original sequence). Better sequences exist (Ciura, Sedgewick) — the visualizer keeps the simple halving sequence to keep the trace readable.

## Suggested pseudocode

```
1  for gap = n/2 down to 1, gap /= 2
2    for i = gap to n-1
3      tmp = a[i]; j = i
4      while j >= gap and a[j-gap] > tmp
5        a[j] = a[j-gap]
6        j = j - gap
7      a[j] = tmp
```

## Wiring notes

- `op.line(1)` at each gap iteration; consider also a `op.range(0, n-1, 'shell-gap')` to communicate the gap visually (not currently shown).
- `op.line(4)` paired with the existing `op.compare(j - gap, i)`.
- `op.line(5)` on the shift, `op.line(7)` on the final write only when `j !== i` (matches the `if (j !== i)` guard).
