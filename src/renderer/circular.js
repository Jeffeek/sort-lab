import { Op } from '../ops.js';

/**
 * Circular (color-wheel) renderer. Each array slot is a wedge whose hue is
 * driven by its value. Highlights are recorded as op-time state and cleared
 * once per draw, so swap/compare flashes survive across the per-frame batch.
 */
export class CircularRenderer {
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
        this.canvas.style.margin = 'auto';
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
            case Op.COMPARE:
                this._hl.set(operation.i, 'read');
                this._hl.set(operation.j, 'read');
                break;
            case Op.SWAP:
                this._hl.set(operation.i, 'write');
                this._hl.set(operation.j, 'write');
                break;
            case Op.WRITE:
                this._hl.set(operation.i, 'write');
                break;
        }
        this._draw();
        this._hl.clear();
    }

    _resize() {
        const r = this.container.getBoundingClientRect();
        const s = Math.max(50, Math.min(r.width, r.height));
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = s * dpr;
        this.canvas.height = s * dpr;
        this.canvas.style.width = `${s}px`;
        this.canvas.style.height = `${s}px`;
    }

    _draw() {
        const { ctx, canvas, values, length: n } = this;
        if (!ctx || !values.length) return;
        const w = canvas.width, h = canvas.height;
        const cx = w / 2, cy = h / 2;
        const radius = Math.min(w, h) / 2 - 2;
        ctx.clearRect(0, 0, w, h);
        const step = (2 * Math.PI) / n;
        for (let i = 0; i < n; i++) {
            const v = values[i];
            const hl = this._hl.get(i);
            const hue = (v / n) * 360;
            ctx.fillStyle = hl === 'write' ? '#ffffff'
                          : hl === 'read'  ? '#ff5577'
                          : `hsl(${hue}, 78%, 55%)`;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, i * step - Math.PI / 2, (i + 1) * step - Math.PI / 2);
            ctx.closePath();
            ctx.fill();
        }
    }

    async finale() {
        for (let i = 0; i < 3; i++) {
            this.container.style.filter = i % 2 ? 'brightness(1.5)' : 'brightness(1)';
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
