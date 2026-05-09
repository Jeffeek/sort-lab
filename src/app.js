/**
 * Application controller. Wires DOM controls to the registry, renderer, audio,
 * stats, and player. Owns no algorithm logic of its own — adding sorts or
 * renderers should not require changes here beyond a possible select option.
 */
import './algorithms/index.js';
import { Algorithms } from './registry.js';
import { generateArray, DISTRIBUTIONS, DISTRIBUTION_LABELS } from './data.js';
import { BarRenderer } from './renderer/bar.js';
import { CircularRenderer } from './renderer/circular.js';
import { DotRenderer } from './renderer/dot.js';
import { Player } from './player.js';
import { Stats } from './stats.js';
import { Sonifier } from './audio.js';
import { Settings } from './settings.js';

const RENDERERS = {
    bar:      { label: 'Bars',     ctor: BarRenderer      },
    circular: { label: 'Circular', ctor: CircularRenderer },
    dot:      { label: 'Dots',     ctor: DotRenderer      },
};

class App {
    constructor() {
        this.dom = {
            container:    document.getElementById('container'),
            algorithm:    document.getElementById('algorithm'),
            distribution: document.getElementById('distribution'),
            renderer:     document.getElementById('renderer'),
            size:         document.getElementById('arraySize'),
            opsPerFrame:  document.getElementById('opsPerFrame'),
            seed:         document.getElementById('seed'),
            audio:        document.getElementById('audio'),
            start:        document.getElementById('btnStart'),
            pause:        document.getElementById('btnPause'),
            step:         document.getElementById('btnStep'),
            stats: {
                compares: document.getElementById('statCompares'),
                swaps:    document.getElementById('statSwaps'),
                reads:    document.getElementById('statReads'),
                writes:   document.getElementById('statWrites'),
                elapsed:  document.getElementById('statElapsed'),
            },
            complexity:   document.getElementById('complexity'),
            pseudocode:   document.getElementById('pseudocode'),
        };

        this.stats = new Stats(this.dom.stats);
        this.sonifier = new Sonifier();
        this.renderer = null;
        this._currentRendererId = null;
        this._activePseudoLine = -1;

        this.player = new Player({
            renderer: null, // set after renderer mount; player will look at this.renderer
            sonifier: this.sonifier,
            stats: this.stats,
            onState: state => this._reflectPlayerState(state),
            onLine: n => this._highlightLine(n),
        });
    }

    init() {
        this._populateSelect(this.dom.algorithm,
            Algorithms.list().map(a => ({ value: a.id, label: a.label })));
        this._populateSelect(this.dom.distribution,
            DISTRIBUTIONS.map(d => ({ value: d, label: DISTRIBUTION_LABELS[d] })));
        this._populateSelect(this.dom.renderer,
            Object.entries(RENDERERS).map(([k, v]) => ({ value: k, label: v.label })));

        this._restoreSettings();
        this._wireEvents();
        this._setRenderer(this.dom.renderer.value, /*remountOnly*/ true);
        this._regenerate();
        this._refreshAlgoMeta();
    }

    _populateSelect(select, items) {
        select.innerHTML = '';
        for (const { value, label } of items) {
            const opt = document.createElement('option');
            opt.value = value; opt.textContent = label;
            select.appendChild(opt);
        }
    }

    _restoreSettings() {
        const set = (el, key) => {
            const v = Settings.get(key);
            if (v != null) el.value = v;
        };
        set(this.dom.size,         'size');
        set(this.dom.algorithm,    'algorithm');
        set(this.dom.distribution, 'distribution');
        set(this.dom.renderer,     'renderer');
        set(this.dom.opsPerFrame,  'opsPerFrame');
        const audio = Settings.get('audio', false);
        this.dom.audio.checked = !!audio;
    }

    _wireEvents() {
        this.dom.start.addEventListener('click', () => this._start());
        this.dom.pause.addEventListener('click', () => this._togglePause());
        this.dom.step.addEventListener('click', () => this.player.step());

        this.dom.algorithm.addEventListener('change', () => {
            Settings.set('algorithm', this.dom.algorithm.value);
            this._refreshAlgoMeta();
        });
        this.dom.distribution.addEventListener('change', () => {
            Settings.set('distribution', this.dom.distribution.value);
            this._regenerate();
        });
        this.dom.renderer.addEventListener('change', () => {
            Settings.set('renderer', this.dom.renderer.value);
            this._setRenderer(this.dom.renderer.value);
            this._regenerate();
        });
        this.dom.size.addEventListener('change', () => {
            const v = clampInt(this.dom.size.value, 4, 4000, 100);
            this.dom.size.value = v;
            Settings.set('size', v);
            this._regenerate();
        });
        this.dom.opsPerFrame.addEventListener('change', () => {
            const v = clampInt(this.dom.opsPerFrame.value, 1, 5000, 1);
            this.dom.opsPerFrame.value = v;
            Settings.set('opsPerFrame', v);
            this.player.setOpsPerFrame(v);
        });
        this.dom.seed.addEventListener('change', () => this._regenerate());

        this.dom.audio.addEventListener('change', () => {
            Settings.set('audio', this.dom.audio.checked);
            this.sonifier.setEnabled(this.dom.audio.checked);
        });

        document.addEventListener('keydown', (e) => {
            if (isTypingTarget(e.target)) return;
            switch (e.key) {
                case ' ':       e.preventDefault(); this._togglePause(); break;
                case 'r': case 'R': this._start(); break;
                case 'ArrowRight': this.player.step(); break;
                case 'm': case 'M':
                    this.dom.audio.checked = !this.dom.audio.checked;
                    this.dom.audio.dispatchEvent(new Event('change'));
                    break;
            }
        });
    }

    _setRenderer(id, remountOnly = false) {
        if (this._currentRendererId === id && this.renderer) return;
        if (this.renderer?.destroy) this.renderer.destroy();
        const ctor = RENDERERS[id]?.ctor || BarRenderer;
        this.renderer = new ctor(this.dom.container);
        this.player.renderer = this.renderer;
        this._currentRendererId = id;
        if (remountOnly) {
            // initial mount handled by _regenerate
        }
    }

    _regenerate() {
        this.player.cancel();
        const size = clampInt(this.dom.size.value, 4, 4000, 100);
        const distribution = this.dom.distribution.value;
        const seedRaw = this.dom.seed.value.trim();
        const seed = seedRaw === '' ? null : Number(seedRaw);
        const { values, seed: usedSeed } = generateArray(size, distribution, seed);
        if (seedRaw === '') this.dom.seed.placeholder = `auto: ${usedSeed}`;
        this.sonifier.setMaxValue(size);
        this.renderer.mount(values);
        this._lastValues = values;
        this.stats.reset();
        this._highlightLine(-1);
    }

    _start() {
        const algo = Algorithms.get(this.dom.algorithm.value);
        if (!algo) return;
        this._regenerate();
        if (this.dom.audio.checked) this.sonifier.setEnabled(true);
        const opsPerFrame = clampInt(this.dom.opsPerFrame.value, 1, 5000, 1);
        const data = this._lastValues.slice();
        this.player.start(data, algo.run(data), { opsPerFrame });
    }

    _togglePause() {
        if (this.player.state === 'running') this.player.pause();
        else if (this.player.state === 'paused') this.player.resume();
    }

    _reflectPlayerState(state) {
        this.dom.pause.textContent = state === 'paused' ? 'Resume' : 'Pause';
        this.dom.pause.disabled = !(state === 'running' || state === 'paused');
        this.dom.step.disabled = state !== 'paused';
    }

    _refreshAlgoMeta() {
        const algo = Algorithms.get(this.dom.algorithm.value);
        if (!algo) return;
        const c = algo.complexity;
        this.dom.complexity.textContent = c
            ? `best ${c.best} · avg ${c.average} · worst ${c.worst} · space ${c.space} · ${c.stable ? 'stable' : 'unstable'}`
            : '';
        const code = algo.pseudocode;
        this.dom.pseudocode.innerHTML = '';
        if (!code) {
            this.dom.pseudocode.textContent = '(no pseudocode)';
            return;
        }
        for (let i = 0; i < code.length; i++) {
            const line = document.createElement('div');
            line.className = 'pseudo-line';
            line.dataset.line = String(i + 1);
            line.textContent = code[i];
            this.dom.pseudocode.appendChild(line);
        }
        this._activePseudoLine = -1;
    }

    _highlightLine(n) {
        const prev = this.dom.pseudocode.querySelector('.pseudo-line.active');
        if (prev) prev.classList.remove('active');
        this._activePseudoLine = n;
        if (n < 0) return;
        const next = this.dom.pseudocode.querySelector(`.pseudo-line[data-line="${n}"]`);
        if (next) next.classList.add('active');
    }
}

function clampInt(raw, min, max, fallback) {
    const v = parseInt(raw, 10);
    if (!Number.isFinite(v)) return fallback;
    return Math.min(max, Math.max(min, v));
}

function isTypingTarget(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA');
}

document.addEventListener('DOMContentLoaded', () => new App().init());
