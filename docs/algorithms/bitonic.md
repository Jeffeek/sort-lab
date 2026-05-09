# Bitonic Sort

Sorting network. Recursively builds a *bitonic sequence* (one ascending then one descending half) and merges it into a sorted sequence using a fixed pattern of compare-and-swap pairs. The comparison structure is **data-independent** — the same compares run regardless of input — which is why it parallelizes well and shows up in GPU sort kernels.

Native size is a power of two. This implementation pads to the next power of two with `Number.MAX_SAFE_INTEGER` sentinels, runs the network on the padded buffer, suppresses ops involving sentinel slots, and emits a final settle pass that writes the in-range result back into `a`.

## Suggested pseudocode

```
1  pad n up to power of two with +∞ sentinels
2  bitonicSort(lo, cnt, dir):
3    if cnt <= 1: return
4    bitonicSort(lo,       cnt/2, ascending)
5    bitonicSort(lo+cnt/2, cnt/2, descending)
6    bitonicMerge(lo, cnt, dir)
7  bitonicMerge(lo, cnt, dir):
8    if cnt <= 1: return
9    for i = lo to lo+cnt/2-1
10     compareSwap(i, i + cnt/2, dir)
11   bitonicMerge(lo,       cnt/2, dir)
12   bitonicMerge(lo+cnt/2, cnt/2, dir)
13 settle: copy padded[0..n-1] back into a
```

## Wiring notes

- The recursive structure makes line highlighting noisy — yields fire bottom-up on every leaf compare. Consider yielding `op.line` only in `compareSwap` (line 10) and at entry to `bitonicSort`/`bitonicMerge` (lines 2/7), not inside the recursion descent itself.
- The settle pass (line 13) only fires when sentinels caused divergence — call it out in the pseudocode but expect it to be invisible at power-of-two sizes.
- The current `compareSwap` already guards with `if (i < n && j < n)` to suppress sentinel ops; preserve that.
