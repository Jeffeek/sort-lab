# Algorithm docs (for AI sessions)

Context for sorts whose `src/algorithms/<name>.js` module currently lacks a `pseudocode` array and `op.line(n)` calls. Each file in this directory explains *what* the algorithm does, gives a numbered pseudocode the implementation should mirror, and points at the `*run` lines where `yield op.line(n)` belongs.

## Why these are missing pseudocode

`pseudocode` is optional in the registry (`src/registry.js:27`). The visualizer falls back to "(no pseudocode)" in `src/app.js:210` when absent. The seven algorithms that *do* have pseudocode (bubble, selection, insertion, quick, merge, heap; radix has the array only) were wired in piecemeal — the rest were left visualization-only. No architectural blocker.

## How to add pseudocode to an algorithm

1. Add a `pseudocode: [...]` array of strings to the default export (each string = one line, 1-indexed in the highlighter).
2. Inside `*run`, `yield op.line(n)` immediately before the corresponding logic. The `LINE` op short-circuits the renderer (`src/player.js:128`) and only updates the pseudocode panel.
3. Keep the pseudocode array short — the sidebar wraps poorly past ~12 lines at the default 280px width.
4. After registering, `Player._tick` will already pump `op.line` ops to `App._highlightLine`; no other wiring needed.

## Files

- [cocktail.md](cocktail.md)
- [gnome.md](gnome.md)
- [shell.md](shell.md)
- [comb.md](comb.md)
- [tim.md](tim.md)
- [intro.md](intro.md)
- [counting.md](counting.md)
- [bucket.md](bucket.md)
- [pancake.md](pancake.md)
- [bitonic.md](bitonic.md)
- [bogo.md](bogo.md)
