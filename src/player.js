import { Op, VISUAL_OP_TYPES } from './ops.js';

/**
 * Drives an algorithm generator at a configurable frame budget, owning the
 * single source of truth for the array model and dispatching ops to the
 * renderer, sonifier, stats sink, and pseudocode highlighter.
 *
 * Uses requestAnimationFrame so visual updates are naturally aligned to the
 * display refresh — large N stays smooth because we drain N ops per frame
 * rather than one op per setTimeout. Pause/Step/Resume are first-class:
 * pausing simply suspends the RAF loop; stepping injects a single-op tick.
 *
 * Note: a Web Worker variant (run generator off-main-thread) is intentionally
 * deferred. The frame-budget loop already keeps the main thread responsive at
 * realistic sizes; adding a worker would require message-batching protocol and
 * isn't justified yet.
 */
export class Player {
    constructor({ renderer, sonifier, stats, onState, onLine }) {
        this.renderer = renderer;
        this.sonifier = sonifier;
        this.stats = stats;
        this.onState = onState || (() => {});
        this.onLine = onLine || (() => {});
        this.values = [];
        this.opsPerFrame = 1;
        this._raf = null;
        this._iter = null;
        this._state = 'idle'; // 'idle' | 'running' | 'paused' | 'done' | 'cancelled'
        this._startTime = 0;
        this._stepOnce = false;
        this._onDone = null;
    }

    get state() { return this._state; }

    cancel() {
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = null;
        this._iter = null;
        this._setState('cancelled');
    }

    pause() {
        if (this._state !== 'running') return;
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = null;
        this._setState('paused');
    }

    resume() {
        if (this._state !== 'paused') return;
        this._setState('running');
        this._scheduleTick();
    }

    step() {
        if (this._state !== 'paused') return;
        this._stepOnce = true;
        this._tick();
    }

    start(values, generator, { opsPerFrame = 1, onDone } = {}) {
        this.cancel();
        this.values = values.slice();
        this._iter = generator;
        this.opsPerFrame = Math.max(1, opsPerFrame | 0);
        this._startTime = performance.now();
        this._onDone = onDone;
        this.stats?.reset();
        this.renderer.mount(this.values);
        this._setState('running');
        this._scheduleTick();
    }

    setOpsPerFrame(n) { this.opsPerFrame = Math.max(1, n | 0); }

    _setState(s) { this._state = s; this.onState(s); }

    _scheduleTick() {
        this._raf = requestAnimationFrame(() => this._tick());
    }

    _tick() {
        if (!this._iter) return;
        if (this._state !== 'running' && !this._stepOnce) return;

        const budget = this._stepOnce ? 1 : this.opsPerFrame;
        for (let n = 0; n < budget; n++) {
            const { value: operation, done } = this._iter.next();
            if (done) {
                this._stepOnce = false;
                this._finish();
                return;
            }
            this._apply(operation);
        }
        this._stepOnce = false;
        this.stats?.tickTime(performance.now() - this._startTime);
        this.stats?.flush();

        if (this._state === 'running') this._scheduleTick();
    }

    _apply(operation) {
        switch (operation.type) {
            case Op.SWAP: {
                const { i, j } = operation;
                if (i !== j) {
                    [this.values[i], this.values[j]] = [this.values[j], this.values[i]];
                    this.stats?.swap();
                    this.sonifier?.ping(this.values[i]);
                }
                break;
            }
            case Op.WRITE:
                this.values[operation.i] = operation.value;
                this.stats?.write();
                this.sonifier?.ping(operation.value);
                break;
            case Op.COMPARE:
                this.stats?.compare();
                this.sonifier?.ping(this.values[operation.i]);
                break;
            case Op.READ:
                this.stats?.read();
                break;
            case Op.LINE:
                this.onLine(operation.n);
                return; // no renderer pass-through
        }
        this.renderer.apply(operation, this.values);
    }

    async _finish() {
        this._raf = null;
        this._iter = null;
        this.stats?.tickTime(performance.now() - this._startTime);
        this.stats?.flush();
        await this.renderer.finale();
        this._setState('done');
        this._onDone?.();
    }
}

export { VISUAL_OP_TYPES };
