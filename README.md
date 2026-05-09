# sort-lab

> A pluggable, generator-based sorting algorithm visualizer. 18 sorts, 3 renderers, audio sonification, live stats, pseudocode highlighting — and zero build step.

[**Live demo →**](https://jeffeek.github.io/sort-lab/)

![sortscope screenshot](docs/screenshot.png)

---

## Why

Most sort visualizers tangle algorithm logic with the DOM. This one doesn't. Algorithms are pure generators that yield abstract `Operation` objects; everything visible — bars, color wheels, scatter dots, sound, stats, pseudocode — is a downstream consumer of that op stream. The architecture is the point: adding a sort is a one-file change, and so is adding a new way to render one.

```
Algorithm ──yields──▶ Operation ──▶ Player ──▶ { Renderer | Sonifier | Stats | Pseudocode }
                                       └─ owns the array model
```

---

## Features

- **18 algorithms** across comparison, non-comparison, and specialty families.
- **3 interchangeable renderers** — DOM bars, canvas color-wheel, canvas dot scatter.
- **Live pseudocode highlighting** — the active line tracks the running generator.
- **Stat counters** — compares, swaps, reads, writes, elapsed time.
- **Seedable PRNG** with 6 input distributions: random, nearly-sorted, reversed, few-unique, sawtooth, gaussian.
- **WebAudio sonification** — pitch maps to value; throttled so bursts don't melt your speakers.
- **First-class playback** — pause / step / resume, configurable ops-per-frame budget.
- **Persistent settings** — algorithm, distribution, renderer, size, audio choice survive reload.
- **No build, no bundler** — vanilla ES modules, served straight off disk.

## Algorithms

| Family | Sorts |
|---|---|
| Comparison | bubble, cocktail, gnome, insertion, selection, shell, comb, quick, merge, heap, tim (simplified), intro |
| Non-comparison | radix (LSD, base 10), counting, bucket |
| Specialty | pancake, bitonic, bogo (capped) |

Every algorithm ships with complexity metadata and pseudocode. Pick any from the dropdown.

## Renderers

| Renderer | Best for |
|---|---|
| **Bars** | Classic view; range backdrops and pivot highlights |
| **Circular** | Hue encodes value, position encodes index — ideal for spotting symmetry |
| **Dot scatter** | Reveals the diagonal of a sorted array; clearer than bars at large N |

## Controls

| Action | Shortcut |
|---|---|
| Pause / resume | `Space` |
| Restart with current settings | `R` |
| Step one operation (while paused) | `→` |
| Toggle audio | `M` |

---

## Run locally

ES modules require an HTTP server (browsers block module loading from `file://`).

```bash
git clone https://github.com/Jeffeek/sort-lab.git
cd sort-lab
npm start          # serves on http://localhost:8080
npm test           # vitest (algorithm correctness suite)
```

No dependencies for the app itself — `npm start` just shells out to `http-server`.

## Deploy to GitHub Pages

The repo is fully static — push `master` and point Pages at it:

1. **Settings → Pages → Source:** `Deploy from a branch`
2. **Branch:** `master` `/ (root)`
3. Wait a minute. Your demo lives at `https://Jeffeek.github.io/sort-lab/`.

No build action required.

---

## Architecture

The seam is `src/ops.js` — a small operation vocabulary (`compare`, `swap`, `read`, `write`, `mark`, `unmark`, `range`, `line`) that algorithms emit and consumers interpret. Algorithms never touch the DOM, audio, or stats; consumers never touch algorithm state.

```
src/
├── ops.js              — operation types + factory functions
├── registry.js         — algorithms self-register here
├── data.js             — seedable PRNG + input distributions
├── player.js           — RAF loop, pause/step/resume, owns the array
├── stats.js            — counter sink
├── audio.js            — WebAudio sonifier (throttled)
├── settings.js         — localStorage k/v
├── renderer/
│   ├── bar.js          — DOM bars
│   ├── circular.js     — canvas color wheel
│   └── dot.js          — canvas scatter
├── algorithms/
│   ├── index.js        — aggregator (one import line per sort)
│   └── <name>.js       — pure generator, exports { id, label, complexity, pseudocode, run }
└── app.js              — wires DOM ↔ everything
```

### Adding a sort

Drop a file in `src/algorithms/`:

```js
import { op } from '../ops.js';

export default {
    id: 'mysort',
    label: 'My Sort',
    complexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(1)', stable: false },
    pseudocode: ['for each pass …', '  yield op.compare …'],
    *run(a) {
        for (let i = 0; i < a.length; i++) {
            yield op.line(1);
            yield op.compare(i, i + 1);
            // …
        }
    },
};
```

Add one import line to `src/algorithms/index.js`. Done — it appears in the dropdown.

### Adding a renderer

Implement `mount(values)`, `apply(operation, values)`, `finale()`, `destroy()`, register it in the `RENDERERS` map in `src/app.js`.

### Per-algorithm notes

Wiring details and pseudocode rationale for each sort live in [`docs/algorithms/`](docs/algorithms/).

---

## Tech notes

- **No build step.** The browser loads ES modules directly from `src/`. Refresh = redeploy.
- **No runtime dependencies.** Vitest is the only dev dependency.
- **RAF-budgeted playback.** Drains N ops per animation frame rather than one op per `setTimeout` — stays smooth at large N. A Web Worker variant was considered and intentionally deferred; the main thread stays responsive without it.
- **Seedable shuffles.** `mulberry32` PRNG; the same seed reproduces the same input array.

## License

[`MIT`](LICENSE)
