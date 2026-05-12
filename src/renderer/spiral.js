import { Op } from '../ops.js';

/**
 * Spiral renderer. Each index sits at a fixed point along an Archimedean
 * spiral; its colour is driven by value. A sorted array produces a smooth
 * radial hue gradient; an unsorted one looks like chromatic confetti.
 */
export class SpiralRenderer {
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
            case Op.COMPARE: this._hl.set(operation.i, 'read');  this._hl.set(operation.j, 'read');  break;
            case Op.SWAP:    this._hl.set(operation.i, 'write'); this._hl.set(operation.j, 'write'); break;
            case Op.WRITE:   this._hl.set(operation.i, 'write'); break;
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
        if (!ctx || !n) return;
        const w = canvas.width, h = canvas.height;
        ctx.fillStyle = '#0b0d10';
        ctx.fillRect(0, 0, w, h);
        const cx = w / 2, cy = h / 2;
        const maxR = Math.min(w, h) / 2 - 4;
        // Tune turn count so dot spacing stays readable across N. Sqrt keeps
        // the spiral from over-densifying at large N.
        const turns = Math.max(3, Math.round(Math.sqrt(n) * 0.6));
        const step = (turns * 2 * Math.PI) / n;
        const dotR = Math.max(2, Math.min(8, maxR / Math.sqrt(n) * 0.9));
        for (let i = 0; i < n; i++) {
            const v = values[i];
            const hl = this._hl.get(i);
            const t = i / n;
            const r = maxR * t;
            const theta = i * step - Math.PI / 2;
            const x = cx + r * Math.cos(theta);
            const y = cy + r * Math.sin(theta);
            const hue = (v / n) * 320;
            ctx.fillStyle = hl === 'write' ? '#ffffff'
                          : hl === 'read'  ? '#ff5577'
                          : `hsl(${hue}, 78%, 55%)`;
            ctx.beginPath();
            ctx.arc(x, y, dotR, 0, Math.PI * 2);
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
