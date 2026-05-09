# Bogo Sort (capped)

Joke algorithm. Shuffles the array uniformly at random and checks if it's sorted; repeats until it is.

Expected runtime is O((n+1)!). On `n = 10` that's ~40 million shuffles average — already past anything the visualizer can pretend to handle. This implementation enforces `ITERATION_CAP = 5_000` and falls back to a quiet insertion sort if the cap is hit, so the trace always terminates.

`Math.random()` is used directly (not the seeded PRNG from `src/data.js`), so bogo runs are *not* reproducible across reruns even with a fixed seed. That's intentional given its joke status, but worth flagging.

## Suggested pseudocode

```
1  iter = 0
2  while not isSorted(a) and iter < CAP
3    Fisher-Yates shuffle a in place
4    iter = iter + 1
5  if not isSorted(a)
6    insertion-sort a   // concession so the visualization terminates
```

## Wiring notes

- `op.line(2)` at the loop test, `op.line(3)` per shuffle (yields a burst of `op.swap`).
- `op.line(5)`/`op.line(6)` only fire on cap-out. Keep them in the array even though most runs exit at line 2 — the cap path is the interesting failure mode.
- Consider switching `Math.random()` to `mulberry32` from `src/data.js` so bogo respects the seed input. Right now seed is silently ignored.
