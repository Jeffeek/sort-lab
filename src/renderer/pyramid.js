import { Op } from '../ops.js';

/**
 * Pyramid renderer. Each bar is centered on the horizontal midline and grows
 * symmetrically up and down — taller values reach further out from the center.
 * Symmetric silhouette reads well in vertical (9:16) layouts.
 */
export class PyramidRenderer {
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
        const cy = h / 2;
        const barW = w / n;
        for (let i = 0; i < n; i++) {
            const v = values[i];
            const hl = this._hl.get(i);
            const halfH = (v / n) * (h / 2);
            ctx.fillStyle = hl === 'write' ? '#ffd24a'
                          : hl === 'read'  ? '#ff5577'
                          : '#d8d8d8';
            ctx.fillRect(i * barW, cy - halfH, Math.ceil(barW) + 1, halfH * 2);
        }
    }

    async finale() {
        const { ctx, canvas, values, length: n } = this;
        if (!ctx) return;
        const w = canvas.width, h = canvas.height;
        const cy = h / 2;
        const barW = w / n;
        const stride = Math.max(1, Math.floor(n / 80));
        for (let i = 0; i < n; i += stride) {
            ctx.fillStyle = '#9eff6e';
            for (let k = 0; k < stride && i + k < n; k++) {
                const v = values[i + k];
                const halfH = (v / n) * (h / 2);
                ctx.fillRect((i + k) * barW, cy - halfH, Math.ceil(barW) + 1, halfH * 2);
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
