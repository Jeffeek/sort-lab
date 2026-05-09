# Bucket Sort

Distribution sort. Splits the value range `[1, max]` into `bucketCount = floor(sqrt(n))` equal-width buckets, drops each `a[i]` into the bucket whose range covers it, sorts each bucket internally (insertion sort here), and concatenates buckets in order.

`sqrt(n)` is the standard heuristic: it balances the O(n) bucket fill cost against the O(b·(n/b)²) intra-bucket sort cost, giving expected O(n) on uniform data.

Worst case O(n²) when all values land in one bucket (degenerates to plain insertion sort).

## Suggested pseudocode

```
1  scan a to find max
2  b = floor(sqrt(n)); buckets[0..b-1] = []
3  for i = 0 to n-1
4    bi = min(b-1, floor((a[i]-1) / max * b))
5    buckets[bi].append(a[i])
6  idx = 0
7  for each bucket
8    insertion-sort bucket
9    copy bucket back into a starting at idx
```

## Wiring notes

- `op.line(1)` at the scan, `op.line(3)`-`op.line(5)` at the distribute loop (already emits `op.read`).
- `op.line(8)` at intra-bucket sort start. The existing implementation insertion-sorts each bucket *silently* — no ops are yielded during the bucket sort itself, only the final write-back. If you want the bucket sort to be visible, insertion-sort needs to yield `op.compare`/`op.write` against bucket-relative indices, which the renderer can't natively show (indices are relative to a temp array, not `a`).
- `op.line(9)` paired with each `op.write` in the flattening loop.
- Visualization caveat worth keeping in the pseudocode comment: intra-bucket work is hidden today.
