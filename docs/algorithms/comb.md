# Comb Sort

Bubble sort with a shrinking gap. Compares elements `gap` apart and shrinks `gap` by a fixed factor (1.3 — the empirically chosen "comb" constant) until `gap = 1`. The early large-gap passes eliminate "turtles" — small values stuck near the end — which is the worst case for plain bubble sort.

A pass with `gap = 1` that produces no swap means sorted.

## Suggested pseudocode

```
1  gap = n; sorted = false
2  while not sorted
3    gap = max(1, floor(gap / 1.3))
4    sorted = (gap == 1)
5    for i = 0 to n-gap-1
6      if a[i] > a[i+gap]
7        swap a[i], a[i+gap]
8        sorted = false
```

## Wiring notes

- `op.line(2)` at the `while`, `op.line(3)`/`op.line(4)` after gap update.
- `op.line(6)` paired with the existing `op.compare(i, i+gap)`.
- `op.line(7)` immediately before the in-place swap and `op.swap`.
- A `op.range` would not help — comb's gap pattern is non-contiguous and the range backdrop is contiguous-only (`src/renderer/bar.js:71`).
