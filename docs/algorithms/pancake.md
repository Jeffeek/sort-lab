# Pancake Sort

Sorts using only **prefix reversals** (`flip(k)` reverses `a[0..k]`). Models flipping a stack of pancakes with a spatula that can only enter from the top.

For each position `size` from `n` down to `2`:

1. Find the index `maxIdx` of the largest element in `a[0..size)`.
2. If `maxIdx != 0`, flip `a[0..maxIdx]` to bring it to the front.
3. Flip `a[0..size-1]` to send it to position `size-1`.

Always O(n²) compares (linear scan per outer iteration); always O(n²) writes (each flip averages size/2). The interest is purely visual — the cascade of reversals is striking.

## Suggested pseudocode

```
1  for size = n down to 2
2    maxIdx = 0
3    for i = 1 to size-1
4      if a[i] > a[maxIdx]: maxIdx = i
5    if maxIdx != size-1
6      if maxIdx != 0: flip(maxIdx)
7      flip(size-1)
```

## Wiring notes

- `op.line(3)`/`op.line(4)` paired with the existing `op.compare(i, maxIdx)`.
- `op.line(6)`/`op.line(7)` before each `flip` call. The flip generator already yields `op.swap` per pair — do not yield `op.line` inside the flip, or every swap will retrigger the highlight.
- Consider an `op.range(0, size-1, 'pancake')` at line 1 to convey the shrinking unsorted prefix.
