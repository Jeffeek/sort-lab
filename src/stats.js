/**
 * Live counters surfaced as DOM updates. Driven by the Player on each op.
 * Kept deliberately decoupled from the algorithm — algorithms only emit ops;
 * stats are derived.
 */
export class Stats {
    constructor(els) {
        this.els = els || {};
        this.reset();
    }
    reset() {
        this.compares = 0;
        this.swaps = 0;
        this.reads = 0;
        this.writes = 0;
        this.elapsed = 0;
        this.flush();
    }
    compare() { this.compares++; this.reads += 2; }
    swap()    { this.swaps++; this.reads += 2; this.writes += 2; }
    read()    { this.reads++; }
    write()   { this.writes++; }
    tickTime(ms) { this.elapsed = ms; }
    flush() {
        if (this.els.compares) this.els.compares.textContent = format(this.compares);
        if (this.els.swaps)    this.els.swaps.textContent    = format(this.swaps);
        if (this.els.reads)    this.els.reads.textContent    = format(this.reads);
        if (this.els.writes)   this.els.writes.textContent   = format(this.writes);
        if (this.els.elapsed)  this.els.elapsed.textContent  = `${(this.elapsed / 1000).toFixed(2)}s`;
    }
}

function format(n) {
    if (n < 1000) return String(n);
    if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
    return `${(n / 1_000_000).toFixed(2)}M`;
}
