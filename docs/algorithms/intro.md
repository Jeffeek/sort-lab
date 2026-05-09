# Intro Sort

Mirrors `std::sort` in libstdc++. Quicksort with two safety nets:

1. **Insertion-sort fallback** when the subrange is small (`hi - lo <= INSERTION_THRESHOLD = 16`). Avoids quicksort's overhead on tiny ranges.
2. **Heapsort fallback** when recursion depth exceeds `2 * floor(log2(n))`. Caps worst-case at O(n log n) without giving up quicksort's average-case constants.

Partition uses last-element-as-pivot (Lomuto). The implementation iterates rather than recursing on the right half (`hi = p - 1` then loop) — standard tail-call elimination to keep the stack bounded.

## Suggested pseudocode

```
1  introsort(lo, hi, depth):
2    while hi - lo > 16
3      if depth == 0: heapsort(lo, hi); return
4      depth = depth - 1
5      p = partition(lo, hi)
6      introsort(p+1, hi, depth)
7      hi = p - 1
8    insertion-sort(lo, hi)
```

## Wiring notes

- The three sub-procedures (`partition`, `insertionRange`, `heapsortRange`) are each their own logical block. Either share one pseudocode and re-highlight line 5/3/8 when they run, or split into three pseudocode arrays — the registry only allows one, so option 1 is simpler.
- `op.line(2)` on the `while` test, `op.line(3)` only when the heap fallback fires (rare; visualizer must use a depth low enough to actually trigger it for demonstration).
- Consider exposing depth/threshold as constants in the algorithm export so they're discoverable.
