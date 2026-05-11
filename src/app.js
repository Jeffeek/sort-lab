/**
 * Application controller. Wires DOM controls to the registry, renderer, audio,
 * stats, and player. Two modes: Single (one algorithm + sidebar) and Compare
 * (N panes sharing input data; each pane owns its algorithm + renderer).
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
import { Pane } from './pane.js';

const RENDERERS = {
    bar:      { label: 'Bars',     ctor: BarRenderer      },
    circular: { label: 'Circular', ctor: CircularRenderer },
    dot:      { label: 'Dots',     ctor: DotRenderer      },
};

class CompareManager {
    constructor({ container, onStateChange }) {
        this.container = container;
        this.onStateChange = onStateChange || (() => {});
        this.panes = [];
        this._lastValues = [];
        this._audio = false;
        this._opsPerFrame = 1;
        this._pendingDones = 0;
    }

    get canAdd() { return this.panes.length < Algorithms.list().length; }

    init(initialAlgoIds) {
        for (const id of initialAlgoIds) this._addPane(id);
        this._mount();
    }

    _addPane(algoId, rendererId = 'bar') {
        const pane = new Pane({
            algoId,
            rendererId,
            onAlgoChange: () => this._refreshConstraints(),
            onStateChange: () => this.onStateChange(),
            onRemove: p => this._removePane(p),
        });
        pane.setAudio(this._audio);
        pane.setOpsPerFrame(this._opsPerFrame);
        this.panes.push(pane);
        return pane;
    }

    addPane() {
        const used = new Set(this.panes.map(p => p.algoId));
        const next = Algorithms.list().find(a => !used.has(a.id));
        if (!next) return;
        const pane = this._addPane(next.id);
        this._mount();
        if (this._lastValues.length) pane.mount(this._lastValues.slice());
        this.onStateChange();
    }

    _removePane(pane) {
        if (this.panes.length <= 1) return;
        pane.destroy();
        this.panes = this.panes.filter(p => p !== pane);
        this._mount();
        this.onStateChange();
    }

    _mount() {
        this.container.innerHTML = '';
        for (const p of this.panes) this.container.appendChild(p.el);
        this._refreshLayout();
        this._refreshConstraints();
    }

    _refreshLayout() {
        const n = Math.max(1, this.panes.length);
        const cols = Math.ceil(Math.sqrt(n));
        const rows = Math.ceil(n / cols);
        this.container.style.setProperty('--cols', cols);
        this.container.style.setProperty('--rows', rows);
    }

    _refreshConstraints() {
        const used = new Set(this.panes.map(p => p.algoId));
        for (const p of this.panes) {
            const excluded = new Set([...used].filter(id => id !== p.algoId));
            p.setExcludedAlgos(excluded);
            p.setRemovable(this.panes.length > 1);
        }
    }

    regenerate(values) {
        this._lastValues = values;
        for (const p of this.panes) {
            p.cancel();
            p.mount(values.slice());
        }
    }

    startAll(values, opsPerFrame, { pacing = 'budget', durationMs = 15000 } = {}) {
        this._lastValues = values;
        this._opsPerFrame = opsPerFrame;
        this._pendingDones = this.panes.length;
        const onDone = () => {
            this._pendingDones--;
            if (this._pendingDones <= 0) this.onStateChange();
        };
        if (pacing === 'scheduled') {
            for (const p of this.panes) p.startScheduled(values.slice(), durationMs, onDone);
        } else {
            for (const p of this.panes) p.start(values.slice(), opsPerFrame, onDone);
        }
    }

    pauseAll()  { for (const p of this.panes) p.pause(); }
    resumeAll() { for (const p of this.panes) p.resume(); }
    stepAll()   { for (const p of this.panes) p.step(); }
    cancelAll() { for (const p of this.panes) p.cancel(); }

    setAudio(on) {
        this._audio = on;
        for (const p of this.panes) p.setAudio(on);
    }

    setOpsPerFrame(n) {
        this._opsPerFrame = n;
        for (const p of this.panes) p.setOpsPerFrame(n);
    }

    get anyRunning() { return this.panes.some(p => p.state === 'running'); }
    get anyPaused()  { return this.panes.some(p => p.state === 'paused'); }
    get anyActive()  { return this.anyRunning || this.anyPaused; }
}

class App {
    constructor() {
        this.dom = {
            container:    document.getElementById('container'),
            panes:        document.getElementById('panes'),
            mode:         document.getElementById('mode'),
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
            addPane:      document.getElementById('btnAddPane'),
            pacing:       document.getElementById('pacing'),
            raceDuration: document.getElementById('raceDuration'),
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

        this.mode = 'single';
        this.stats = new Stats(this.dom.stats);
        this.sonifier = new Sonifier();
        this.renderer = null;
        this._currentRendererId = null;
        this._activePseudoLine = -1;
        this.compare = null;

        this.player = new Player({
            renderer: null,
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
        this._reflectPacing();
        this._applyMode(this.mode, /*initial*/ true);
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
        set(this.dom.pacing,       'pacing');
        set(this.dom.raceDuration, 'raceDuration');
        const audio = Settings.get('audio', false);
        this.dom.audio.checked = !!audio;
        const mode = Settings.get('mode', 'single');
        this.mode = (mode === 'compare') ? 'compare' : 'single';
        this.dom.mode.value = this.mode;
    }

    _wireEvents() {
        this.dom.start.addEventListener('click', () => this._start());
        this.dom.pause.addEventListener('click', () => this._togglePause());
        this.dom.step.addEventListener('click', () => this._step());
        this.dom.addPane.addEventListener('click', () => this.compare?.addPane());

        this.dom.pacing.addEventListener('change', () => {
            Settings.set('pacing', this.dom.pacing.value);
            this._reflectPacing();
        });
        this.dom.raceDuration.addEventListener('change', () => {
            const v = clampInt(this.dom.raceDuration.value, 1, 600, 15);
            this.dom.raceDuration.value = v;
            Settings.set('raceDuration', v);
        });

        this.dom.mode.addEventListener('change', () => {
            const m = this.dom.mode.value;
            Settings.set('mode', m);
            this._applyMode(m);
        });

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
            if (this.mode !== 'single') return;
            // Hot-swap: preserve any in-progress run; mount the current
            // player state into the new renderer rather than regenerating.
            this._setRenderer(this.dom.renderer.value);
            const current = this.player.values?.length ? this.player.values : this._lastValues;
            if (current?.length) this.renderer.mount(current);
            else this._regenerate();
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
            this.compare?.setOpsPerFrame(v);
        });
        this.dom.seed.addEventListener('change', () => this._regenerate());

        this.dom.audio.addEventListener('change', () => {
            Settings.set('audio', this.dom.audio.checked);
            if (this.mode === 'single') {
                this.sonifier.setEnabled(this.dom.audio.checked);
            } else {
                this.compare?.setAudio(this.dom.audio.checked);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (isTypingTarget(e.target)) return;
            switch (e.key) {
                case ' ':       e.preventDefault(); this._togglePause(); break;
                case 'r': case 'R': this._start(); break;
                case 'ArrowRight': this._step(); break;
                case 'm': case 'M':
                    this.dom.audio.checked = !this.dom.audio.checked;
                    this.dom.audio.dispatchEvent(new Event('change'));
                    break;
            }
        });
    }

    _applyMode(mode, initial = false) {
        this.mode = mode;
        document.body.dataset.mode = mode;

        // Stop whatever was running in the prior mode
        if (mode === 'compare') {
            this.player.cancel();
            this.sonifier.setEnabled(false);
            if (!this.compare) {
                this.compare = new CompareManager({
                    container: this.dom.panes,
                    onStateChange: () => this._reflectCompareState(),
                });
                const list = Algorithms.list();
                const initialIds = [list[0]?.id, list[1]?.id].filter(Boolean);
                this.compare.init(initialIds);
            }
            this.compare.setAudio(this.dom.audio.checked);
            this.compare.setOpsPerFrame(currentOpsPerFrame(this.dom));
            this._regenerate();
            this._reflectCompareState();
        } else {
            this.compare?.cancelAll();
            if (this.dom.audio.checked) this.sonifier.setEnabled(true);
            if (initial) {
                this._regenerate();
                this._refreshAlgoMeta();
            } else {
                this._setRenderer(this.dom.renderer.value);
                this._regenerate();
                this._refreshAlgoMeta();
            }
        }
        this._reflectPlayerState(this.player.state);
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

    _generateValues() {
        const size = clampInt(this.dom.size.value, 4, 4000, 100);
        const distribution = this.dom.distribution.value;
        const seedRaw = this.dom.seed.value.trim();
        const seed = seedRaw === '' ? null : Number(seedRaw);
        const { values, seed: usedSeed } = generateArray(size, distribution, seed);
        if (seedRaw === '') this.dom.seed.placeholder = `auto: ${usedSeed}`;
        return values;
    }

    _regenerate() {
        if (this.mode === 'compare') {
            const values = this._generateValues();
            this._lastValues = values;
            this.compare?.regenerate(values);
            return;
        }
        this.player.cancel();
        const values = this._generateValues();
        this.sonifier.setMaxValue(values.length);
        this.renderer.mount(values);
        this._lastValues = values;
        this.stats.reset();
        this._highlightLine(-1);
    }

    _start() {
        const opsPerFrame = currentOpsPerFrame(this.dom);
        if (this.mode === 'compare') {
            this._regenerate();
            if (this.dom.audio.checked) this.compare.setAudio(true);
            const pacing = this.dom.pacing.value === 'scheduled' ? 'scheduled' : 'budget';
            const durationMs = clampInt(this.dom.raceDuration.value, 1, 600, 15) * 1000;
            this.compare.startAll(this._lastValues, opsPerFrame, { pacing, durationMs });
            return;
        }
        const algo = Algorithms.get(this.dom.algorithm.value);
        if (!algo) return;
        this._regenerate();
        if (this.dom.audio.checked) this.sonifier.setEnabled(true);
        const data = this._lastValues.slice();
        this.player.start(data, algo.run(data), { opsPerFrame });
    }

    _togglePause() {
        if (this.mode === 'compare') {
            if (!this.compare) return;
            if (this.compare.anyRunning) this.compare.pauseAll();
            else if (this.compare.anyPaused) this.compare.resumeAll();
            return;
        }
        if (this.player.state === 'running') this.player.pause();
        else if (this.player.state === 'paused') this.player.resume();
    }

    _step() {
        if (this.mode === 'compare') { this.compare?.stepAll(); return; }
        this.player.step();
    }

    _reflectPlayerState(state) {
        if (this.mode === 'compare') return; // CompareManager drives button state
        this.dom.pause.textContent = state === 'paused' ? 'Resume' : 'Pause';
        this.dom.pause.disabled = !(state === 'running' || state === 'paused');
        this.dom.step.disabled = state !== 'paused';
    }

    _reflectPacing() {
        const lab = this.dom.raceDuration.closest('label');
        if (!lab) return;
        lab.style.display = this.dom.pacing.value === 'scheduled' ? '' : 'none';
    }

    _reflectCompareState() {
        if (this.mode !== 'compare' || !this.compare) return;
        const running = this.compare.anyRunning;
        const paused  = this.compare.anyPaused;
        this.dom.pause.textContent = (!running && paused) ? 'Resume' : 'Pause';
        this.dom.pause.disabled = !(running || paused);
        this.dom.step.disabled  = !(paused && !running);
        this.dom.addPane.disabled = !this.compare.canAdd;
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

function currentOpsPerFrame(dom) {
    return clampInt(dom.opsPerFrame.value, 1, 5000, 1);
}

function isTypingTarget(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA');
}

document.addEventListener('DOMContentLoaded', () => new App().init());
