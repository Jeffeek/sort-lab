import { Op } from '../ops.js';

/**
 * DOM-bar renderer. Stateless w.r.t. value model (Player owns it); only
 * mirrors heights and applies CSS classes. Flashes are driven by short CSS
 * animations triggered by toggling a class with a forced reflow — this avoids
 * the buggy "pendingFlash" queue from the previous design and keeps the
 * renderer free of timing concerns.
 */
export class BarRenderer {
    constructor(container) {
        this.container = container;
        this.bars = [];
        this.length = 0;
        this._ranges = new Map();
    }

    mount(values) {
        this.container.innerHTML = '';
        this.container.classList.remove('finale');
        const frag = document.createDocumentFragment();
        this.bars = values.map(v => {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = pct(v, values.length);
            frag.appendChild(bar);
            return bar;
        });
        this.container.appendChild(frag);
        this.length = values.length;
        this._ranges.clear();
    }

    apply(operation, values) {
        switch (operation.type) {
            case Op.COMPARE:
                flash(this.bars[operation.i], 'flash-read');
                flash(this.bars[operation.j], 'flash-read');
                return;
            case Op.SWAP: {
                const { i, j } = operation;
                if (i === j) return;
                this.bars[i].style.height = pct(values[i], this.length);
                this.bars[j].style.height = pct(values[j], this.length);
                flash(this.bars[i], 'flash-write');
                flash(this.bars[j], 'flash-write');
                return;
            }
            case Op.WRITE:
                this.bars[operation.i].style.height = pct(operation.value, this.length);
                flash(this.bars[operation.i], 'flash-write');
                return;
            case Op.READ:
                flash(this.bars[operation.i], 'flash-read');
                return;
            case Op.MARK:
                operation.indices.forEach(i => this.bars[i]?.classList.add(operation.class));
                return;
            case Op.UNMARK:
                operation.indices.forEach(i => {
                    if (!this.bars[i]) return;
                    if (operation.class) this.bars[i].classList.remove(operation.class);
                });
                return;
            case Op.RANGE:
                this._renderRange(operation);
                return;
        }
    }

    _renderRange({ id, lo, hi }) {
        const prev = this._ranges.get(id);
        if (prev) prev.forEach(b => b.classList.remove('in-range'));
        if (lo == null || hi == null) { this._ranges.delete(id); return; }
        const list = [];
        for (let i = lo; i <= hi && i < this.bars.length; i++) {
            this.bars[i].classList.add('in-range');
            list.push(this.bars[i]);
        }
        this._ranges.set(id, list);
    }

    async finale() {
        // Sweep "done" highlight left-to-right; stride scales with N so it stays brief.
        const stride = Math.max(1, Math.floor(this.bars.length / 80));
        const delay = Math.max(2, Math.min(12, Math.floor(600 / (this.bars.length / stride))));
        for (let i = 0; i < this.bars.length; i += stride) {
            for (let k = 0; k < stride && i + k < this.bars.length; k++) {
                this.bars[i + k].classList.add('done');
            }
            await sleep(delay);
        }
        this.container.classList.add('finale');
    }

    destroy() {
        this.container.innerHTML = '';
        this.bars = [];
    }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const pct = (v, n) => `${(v / n) * 100}%`;
function flash(bar, klass) {
    if (!bar) return;
    bar.classList.remove(klass);
    void bar.offsetWidth; // force reflow so the CSS animation restarts
    bar.classList.add(klass);
}
