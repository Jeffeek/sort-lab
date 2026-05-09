# Cocktail Shaker Sort

Bidirectional bubble sort. Each pass first walks `lo..hi` pushing the largest unsorted element to `hi`, then walks back `hi..lo` pulling the smallest to `lo`. Bounds tighten after each half-pass. Terminates when a full round produces no swap.

**Why this shape over bubble sort:** the right-then-left walks halve the cost of "turtles" (small values near the end), which a one-direction bubble sort drags forward one slot per pass.

## Suggested pseudocode

```
1  lo = 0; hi = n-1; swapped = true
2  while swapped
3    swapped = false
4    for i = lo to hi-1
5      if a[i] > a[i+1]: swap a[i], a[i+1]; swapped = true
6    hi = hi - 1
7    for i = hi down to lo+1
8      if a[i] < a[i-1]: swap a[i], a[i-1]; swapped = true
9    lo = lo + 1
```

## Wiring notes

- `op.line(2)` at the `while`, `op.line(3)` after resetting `swapped`.
- `op.line(4)`/`op.line(5)` inside the forward loop (paired with the existing `op.compare`).
- `op.line(6)` after `hi--`, then `op.line(7)`/`op.line(8)` for the backward loop, `op.line(9)` after `lo++`.
- The current `*run` already mutates `a` in lockstep with the yielded ops — only line-yields need adding.
