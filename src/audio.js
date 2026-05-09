/**
 * WebAudio sonification — maps array values to oscillator pitches. Lazy init
 * (first user gesture) per browser autoplay policy. Throttled internally so a
 * burst of ops doesn't spawn thousands of oscillators per frame.
 */
export class Sonifier {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.maxValue = 1;
        this._lastPlay = 0;
        this._minIntervalMs = 8;
    }
    setMaxValue(n) { this.maxValue = Math.max(1, n); }

    setEnabled(on) {
        this.enabled = !!on;
        if (this.enabled && !this.ctx) {
            const Ctor = window.AudioContext || window.webkitAudioContext;
            if (Ctor) this.ctx = new Ctor();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    ping(value, durMs = 30) {
        if (!this.enabled || !this.ctx) return;
        const now = performance.now();
        if (now - this._lastPlay < this._minIntervalMs) return;
        this._lastPlay = now;

        const t = this.ctx.currentTime;
        const freq = 180 + 720 * (value / this.maxValue);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.06, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + durMs / 1000);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + durMs / 1000 + 0.02);
    }
}
