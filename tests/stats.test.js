import { describe, it, expect, beforeEach } from 'vitest';
import { Stats } from '../src/stats.js';

let stats;
beforeEach(() => {
    // Empty els → flush is a no-op; we test counter math in isolation.
    stats = new Stats({});
});

describe('Stats counters', () => {
    it('start at zero', () => {
        expect(stats.compares).toBe(0);
        expect(stats.swaps).toBe(0);
        expect(stats.reads).toBe(0);
        expect(stats.writes).toBe(0);
        expect(stats.elapsed).toBe(0);
    });

    it('compare increments compares by 1 and reads by 2', () => {
        stats.compare();
        expect(stats.compares).toBe(1);
        expect(stats.reads).toBe(2);
        expect(stats.swaps).toBe(0);
        expect(stats.writes).toBe(0);
    });

    it('swap increments swaps by 1 and adds 2 reads + 2 writes', () => {
        stats.swap();
        expect(stats.swaps).toBe(1);
        expect(stats.reads).toBe(2);
        expect(stats.writes).toBe(2);
        expect(stats.compares).toBe(0);
    });

    it('read and write increment their own counter only', () => {
        stats.read();
        stats.read();
        stats.write();
        expect(stats.reads).toBe(2);
        expect(stats.writes).toBe(1);
        expect(stats.compares).toBe(0);
        expect(stats.swaps).toBe(0);
    });

    it('accumulates across many calls', () => {
        for (let i = 0; i < 10; i++) stats.compare();
        for (let i = 0; i < 5; i++) stats.swap();
        expect(stats.compares).toBe(10);
        expect(stats.swaps).toBe(5);
        expect(stats.reads).toBe(10 * 2 + 5 * 2);
        expect(stats.writes).toBe(5 * 2);
    });

    it('tickTime overwrites the elapsed value', () => {
        stats.tickTime(123.45);
        expect(stats.elapsed).toBe(123.45);
        stats.tickTime(0);
        expect(stats.elapsed).toBe(0);
    });

    it('reset returns every counter to zero', () => {
        stats.compare(); stats.swap(); stats.read(); stats.write();
        stats.tickTime(999);
        stats.reset();
        expect(stats.compares).toBe(0);
        expect(stats.swaps).toBe(0);
        expect(stats.reads).toBe(0);
        expect(stats.writes).toBe(0);
        expect(stats.elapsed).toBe(0);
    });
});

describe('Stats DOM flush', () => {
    it('writes formatted counts to provided elements', () => {
        const make = () => ({ textContent: '' });
        const els = {
            compares: make(), swaps: make(), reads: make(),
            writes: make(), elapsed: make(),
        };
        const s = new Stats(els);
        for (let i = 0; i < 1500; i++) s.compare();
        s.tickTime(2500);
        s.flush();
        expect(els.compares.textContent).toBe('1.5k');
        expect(els.reads.textContent).toBe('3.0k');
        expect(els.elapsed.textContent).toBe('2.50s');
    });

    it('formats millions with M suffix', () => {
        const el = { textContent: '' };
        const s = new Stats({ compares: el });
        for (let i = 0; i < 2_500_000; i++) s.compares++;
        s.flush();
        expect(el.textContent).toBe('2.50M');
    });

    it('tolerates missing element keys', () => {
        const s = new Stats({}); // no els
        expect(() => { s.compare(); s.flush(); }).not.toThrow();
    });
});
