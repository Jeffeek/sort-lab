import { Op } from '../ops.js';

/**
 * Heatmap renderer. A single horizontal strip where each cell's hue is driven
 * by its value. Sortedness reads as a smooth left→right colour gradient;
 * unsorted arrays look like chromatic noise.
 */
export class HeatmapRenderer {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.ctx = null;
        this.values = [];
        this.length = 0;
        this._hl = new Map();
        this._resizeObs = null;
    }

    mount(values) {
        this.container.innerHTML = '';
        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'block';
        this.container.appendChild(this.canvas);
        this._resize();
        this.ctx = this.canvas.getContext('2d');
        this.values = values.slice();
        this.length = values.length;
        this._hl.clear();
        this._draw();

        if (this._resizeObs) this._resizeObs.disconnect();
        this._resizeObs = new ResizeObserver(() => { this._resize(); this._draw(); });
        this._resizeObs.observe(this.container);
    }

    apply(operation, values) {
        if (values) this.values = values;
        switch (operation.type) {
            case Op.COMPARE: this._hl.set(operation.i, 'read');  this._hl.set(operation.j, 'read');  break;
            case Op.SWAP:    this._hl.set(operation.i, 'write'); this._hl.set(operation.j, 'write'); break;
            case Op.WRITE:   this._hl.set(operation.i, 'write'); break;
        }
        this._draw();
        this._hl.clear();
    }

    _resize() {
        const r = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.max(50, r.width) * dpr;
        this.canvas.height = Math.max(50, r.height) * dpr;
        this.canvas.style.width = `${r.width}px`;
        this.canvas.style.height = `${r.height}px`;
    }

    _draw() {
        const { ctx, canvas, values, length: n } = this;
        if (!ctx || !n) return;
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = '#0b0d10';
        ctx.fillRect(0, 0, w, h);
        const cellW = w / n;
        for (let i = 0; i < n; i++) {
            const v = values[i];
            const hl = this._hl.get(i);
            const hue = (v / n) * 320; // 0=red → 320=magenta; full circle reads as a rainbow
            ctx.fillStyle = hl === 'write' ? '#ffffff'
                          : hl === 'read'  ? '#ff5577'
                          : `hsl(${hue}, 78%, 55%)`;
            ctx.fillRect(i * cellW, 0, Math.ceil(cellW) + 1, h);
        }
    }

    async finale() {
        for (let i = 0; i < 3; i++) {
            this.container.style.filter = i % 2 ? 'brightness(1.6)' : 'brightness(1)';
            await new Promise(r => setTimeout(r, 100));
        }
        this.container.style.filter = '';
    }

    destroy() {
        this._resizeObs?.disconnect();
        this._resizeObs = null;
        this.container.innerHTML = '';
    }
}
