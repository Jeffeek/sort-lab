# Tim Sort (simplified)

Two-phase hybrid:

1. **Run phase** — partition the array into fixed-size runs of `RUN = 32` and insertion-sort each run in place.
2. **Merge phase** — bottom-up merge runs of size 32 → 64 → 128 → … using an auxiliary buffer, doubling each iteration until one run covers the whole array.

The real Tim sort detects natural runs and maintains a stack with size invariants (`runLen[i-2] > runLen[i-1] + runLen[i]`, etc.). This implementation skips that for clarity — the run/merge structure is preserved, the adaptive heuristics are not.

## Suggested pseudocode

```
1  RUN = 32
2  for start = 0 to n-1 step RUN
3    insertion-sort a[start .. min(start+RUN, n)-1]
4  for size = RUN; size < n; size *= 2
5    for lo = 0 to n-1 step size*2
6      mid = min(lo + size - 1, n-1)
7      hi  = min(lo + size*2 - 1, n-1)
8      if mid < hi: merge a[lo..mid] with a[mid+1..hi]
```

## Wiring notes

- `op.line(2)`/`op.line(3)` at the run-phase outer/inner. The existing `op.range(start, end-1, 'tim-run')` already brackets each run visually.
- `op.line(4)` at the merge-phase outer, `op.line(5)`-`op.line(8)` inside.
- Be careful: there are *two* nested merge loops emitting `op.compare`/`op.write`. Yielding `op.line` inside the merge inner loop on every iteration can dominate the trace at small N — yield once per merge, not per element, unless you want a literal step-through.
