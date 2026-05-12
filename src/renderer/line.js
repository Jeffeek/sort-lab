import { Op } from '../ops.js';

/**
 * Line renderer. Plots (i, value) as a connected polyline. Unsorted arrays
 * read as noisy zigzags; a sorted array collapses to a clean monotone
 * diagonal. Highlights overlay as coloured dots at the touched indices.
 */
export class LineRenderer {
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

        const dx = w / Math.max(1, n - 1);
        ctx.strokeStyle = '#dcdcdc';
        ctx.lineWidth = Math.max(1.5, Math.min(4, w / n / 6));
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const y = h - (values[i] / n) * h;
            if (i === 0) ctx.moveTo(0, y);
            else ctx.lineTo(i * dx, y);
        }
        ctx.stroke();

        if (this._hl.size) {
            const dotR = Math.max(3, Math.min(8, w / n / 2));
            for (const [i, kind] of this._hl) {
                const y = h - (values[i] / n) * h;
                ctx.fillStyle = kind === 'write' ? '#ffd24a' : '#ff5577';
                ctx.beginPath();
                ctx.arc(i * dx, y, dotR, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    async finale() {
        // Flash to green then back, twice.
        for (let i = 0; i < 4; i++) {
            const { ctx, canvas, values, length: n } = this;
            const w = canvas.width, h = canvas.height;
            ctx.fillStyle = '#0b0d10';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = i % 2 ? '#9eff6e' : '#dcdcdc';
            ctx.lineWidth = Math.max(2, Math.min(5, w / n / 5));
            ctx.beginPath();
            const dx = w / Math.max(1, n - 1);
            for (let k = 0; k < n; k++) {
                const y = h - (values[k] / n) * h;
                if (k === 0) ctx.moveTo(0, y);
                else ctx.lineTo(k * dx, y);
            }
            ctx.stroke();
            await new Promise(r => setTimeout(r, 110));
        }
    }

    destroy() {
        this._resizeObs?.disconnect();
        this._resizeObs = null;
        this.container.innerHTML = '';
    }
}
