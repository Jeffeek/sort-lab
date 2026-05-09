# Gnome Sort

Walks a single cursor `i`. If `a[i-1] <= a[i]` (or `i == 0`), advance. Otherwise swap and step back. The "garden gnome" analogy: the gnome carries a flower pot back to its sorted position one step at a time, then resumes walking.

Behaves like an insertion sort that reaches its insertion point via swaps instead of shifts — same O(n²) average, same O(n) best on already-sorted input.

## Suggested pseudocode

```
1  i = 0
2  while i < n
3    if i == 0 or a[i-1] <= a[i]
4      i = i + 1
5    else
6      swap a[i], a[i-1]
7      i = i - 1
```

## Wiring notes

- `op.line(2)` at the top of the `while`.
- `op.line(3)` before the comparison; the existing `op.compare(i-1, i)` stays.
- `op.line(4)` on the forward branch, `op.line(6)`/`op.line(7)` on the swap-and-back branch.
- The `if (i === 0)` short-circuit at the top of the existing implementation skips the compare — guard the line yield accordingly so the highlight tracks the actual branch taken.
