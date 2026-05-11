import { Algorithms } from './registry.js';
import { BarRenderer } from './renderer/bar.js';
import { CircularRenderer } from './renderer/circular.js';
import { DotRenderer } from './renderer/dot.js';
import { Player } from './player.js';
import { Stats } from './stats.js';
import { Sonifier } from './audio.js';

const RENDERERS = {
    bar:      { label: 'Bars',     ctor: BarRenderer      },
    circular: { label: 'Circular', ctor: CircularRenderer },
    dot:      { label: 'Dots',     ctor: DotRenderer      },
};

/**
 * Self-contained comparison pane: one algorithm, one renderer, one player,
 * one stats counter, one sonifier. Used by Compare mode.
 */
export class Pane {
    constructor({ algoId, rendererId = 'bar', onAlgoChange, onStateChange, onRemove }) {
        this.onAlgoChange = onAlgoChange || (() => {});
        this.onStateChange = onStateChange || (() => {});
        this.onRemove = onRemove || (() => {});
        this._excluded = new Set();
        this.lastValues = [];

        this.el = document.createElement('div');
        this.el.className = 'pane';

        const header = document.createElement('div');
        header.className = 'pane-header';

        this.algoSelect = document.createElement('select');
        this.algoSelect.className = 'pane-algo';

        this.rendererSelect = document.createElement('select');
        this.rendererSelect.className = 'pane-renderer';
        for (const [k, v] of Object.entries(RENDERERS)) {
            const opt = document.createElement('option');
            opt.value = k; opt.textContent = v.label;
            this.rendererSelect.appendChild(opt);
        }
        this.rendererSelect.value = rendererId;

        this.raceInfo = document.createElement('span');
        this.raceInfo.className = 'pane-race-info';

        this.removeBtn = document.createElement('button');
        this.removeBtn.className = 'pane-remove';
        this.removeBtn.type = 'button';
        this.removeBtn.textContent = '✕';
        this.removeBtn.title = 'Remove pane';

        header.append(this.algoSelect, this.rendererSelect, this.raceInfo, this.removeBtn);

        this.body = document.createElement('div');
        this.body.className = 'pane-body';

        const footer = document.createElement('div');
        footer.className = 'pane-footer';
        const statEls = {};
        for (const [key, label] of [
            ['compares', 'Compares'], ['swaps', 'Swaps'],
            ['reads', 'Reads'], ['writes', 'Writes'], ['elapsed', 'Elapsed'],
        ]) {
            const cell = document.createElement('div');
            cell.className = 'pane-stat';
            const k = document.createElement('span'); k.className = 'k'; k.textContent = label;
            const v = document.createElement('span'); v.className = 'v';
            cell.append(k, v);
            footer.appendChild(cell);
            statEls[key] = v;
        }

        this.el.append(header, this.body, footer);

        this.stats = new Stats(statEls);
        this.sonifier = new Sonifier();
        this.renderer = null;
        this._currentRendererId = null;
        this.player = new Player({
            renderer: null,
            sonifier: this.sonifier,
            stats: this.stats,
            onState: s => this.onStateChange(this, s),
        });

        this._populateAlgoSelect(algoId);
        this._setRenderer(this.rendererSelect.value);

        this.algoSelect.addEventListener('change', () => this.onAlgoChange(this));
        this.rendererSelect.addEventListener('change', () => {
            // Hot-swap renderer without interrupting the run. Player keeps its
            // values + iterator; we point it at the new renderer and mount the
            // current mid-sort state (player.values), not the initial input.
            this._setRenderer(this.rendererSelect.value);
            const current = this.player.values?.length ? this.player.values : this.lastValues;
            if (current?.length) this.renderer.mount(current);
        });
        this.removeBtn.addEventListener('click', () => this.onRemove(this));
    }

    get algoId() { return this.algoSelect.value; }
    get rendererId() { return this.rendererSelect.value; }
    get state() { return this.player.state; }

    setRemovable(yes) { this.removeBtn.style.visibility = yes ? '' : 'hidden'; }

    setExcludedAlgos(excluded) {
        this._excluded = excluded;
        this._populateAlgoSelect(this.algoSelect.value);
    }

    _populateAlgoSelect(keepId) {
        this.algoSelect.innerHTML = '';
        for (const a of Algorithms.list()) {
            if (this._excluded.has(a.id) && a.id !== keepId) continue;
            const opt = document.createElement('option');
            opt.value = a.id; opt.textContent = a.label;
            this.algoSelect.appendChild(opt);
        }
        if (keepId) this.algoSelect.value = keepId;
    }

    _setRenderer(id) {
        if (this._currentRendererId === id && this.renderer) return;
        this.renderer?.destroy?.();
        const ctor = RENDERERS[id]?.ctor || BarRenderer;
        this.renderer = new ctor(this.body);
        this.player.renderer = this.renderer;
        this._currentRendererId = id;
    }

    mount(values) {
        this.lastValues = values;
        this.sonifier.setMaxValue(values.length);
        this.renderer.mount(values);
        this.stats.reset();
        this.setRaceInfo('');
    }

    setRaceInfo(text) { this.raceInfo.textContent = text; }

    setAudio(on) { this.sonifier.setEnabled(on); }

    setOpsPerFrame(n) { this.player.setOpsPerFrame(n); }

    start(values, opsPerFrame, onDone) {
        this.lastValues = values;
        this.sonifier.setMaxValue(values.length);
        this.setRaceInfo('');
        const algo = Algorithms.get(this.algoId);
        if (!algo) { onDone?.(); return; }
        const data = values.slice();
        this.player.start(data, algo.run(data), { opsPerFrame, onDone });
    }

    /**
     * Synchronized-race mode: pre-collect this algorithm's full op stream,
     * then play it back over `durationMs`. All panes called with the same
     * duration finish at the same wall-clock time. Header shows total ops
     * and ops/sec for at-a-glance work comparison.
     */
    startScheduled(values, durationMs, onDone) {
        this.lastValues = values;
        this.sonifier.setMaxValue(values.length);
        const algo = Algorithms.get(this.algoId);
        if (!algo) { onDone?.(); return; }
        const simData = values.slice();
        const ops = [...algo.run(simData)];
        const rate = Math.round(ops.length / (durationMs / 1000));
        this.setRaceInfo(`${ops.length.toLocaleString()} ops · ${rate.toLocaleString()}/s`);
        const playData = values.slice();
        this.player.startScheduled(playData, ops, durationMs, { onDone });
    }

    pause()  { this.player.pause(); }
    resume() { this.player.resume(); }
    step()   { this.player.step(); }
    cancel() { this.player.cancel(); }

    destroy() {
        this.cancel();
        this.renderer?.destroy?.();
        this.el.remove();
    }
}
