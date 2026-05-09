import { Op } from '../ops.js';

/**
 * Scatter (dot) renderer. X = index, Y = value. Reveals algorithmic patterns
 * (the diagonal of a sorted array, partial diagonals during merge, etc.) far
 * more clearly than bars at large N.
 */
export class DotRenderer {
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
        const dx = w / n;
        const dotSize = Math.max(2, Math.min(dx, 6));
        for (let i = 0; i < n; i++) {
            const v = values[i];
            const hl = this._hl.get(i);
            ctx.fillStyle = hl === 'write' ? '#9eff6e'
                          : hl === 'read'  ? '#ff5577'
                          : '#dcdcdc';
            const y = h - (v / n) * h;
            ctx.fillRect(i * dx, y, dotSize, dotSize);
        }
    }

    async finale() {
        // Fade dots to green by redrawing in sweep.
        const { ctx, canvas, values, length: n } = this;
        if (!ctx) return;
        const w = canvas.width, h = canvas.height;
        const dx = w / n;
        const dotSize = Math.max(2, Math.min(dx, 6));
        const stride = Math.max(1, Math.floor(n / 80));
        for (let i = 0; i < n; i += stride) {
            for (let k = 0; k < stride && i + k < n; k++) {
                ctx.fillStyle = '#9eff6e';
                const y = h - (values[i + k] / n) * h;
                ctx.fillRect((i + k) * dx, y, dotSize, dotSize);
            }
            await new Promise(r => setTimeout(r, 6));
        }
    }

    destroy() {
        this._resizeObs?.disconnect();
        this._resizeObs = null;
        this.container.innerHTML = '';
    }
}
