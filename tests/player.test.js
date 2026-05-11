import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Player } from '../src/player.js';
import { op } from '../src/ops.js';

// Node has performance.now, but no requestAnimationFrame. Drive RAF off
// setTimeout so the loop can be advanced with real timers in tests.
beforeEach(() => {
    globalThis.requestAnimationFrame = cb => setTimeout(cb, 0);
    globalThis.cancelAnimationFrame  = id => clearTimeout(id);
});
afterEach(() => {
    delete globalThis.requestAnimationFrame;
    delete globalThis.cancelAnimationFrame;
});

function makeRenderer() {
    return {
        mount:   vi.fn(),
        apply:   vi.fn(),
        finale:  vi.fn(async () => {}),
        destroy: vi.fn(),
    };
}

function makeStats() {
    return {
        reset:    vi.fn(),
        compare:  vi.fn(),
        swap:     vi.fn(),
        read:     vi.fn(),
        write:    vi.fn(),
        tickTime: vi.fn(),
        flush:    vi.fn(),
    };
}

function* swapGen() {
    // Two operations: one swap, one write. Enough to exercise _apply branches.
    yield op.swap(0, 1);
    yield op.write(2, 99);
}

function* bigGen(n) {
    for (let i = 0; i < n; i++) yield op.compare(0, 1);
}

describe('Player budget mode', () => {
    it('starts in idle state', () => {
        const p = new Player({ renderer: makeRenderer() });
        expect(p.state).toBe('idle');
    });

    it('runs the generator to completion and fires onDone', async () => {
        const renderer = makeRenderer();
        const p = new Player({ renderer });
        await new Promise(resolve => {
            p.start([5, 4, 3], swapGen(), { opsPerFrame: 10, onDone: resolve });
        });
        expect(p.state).toBe('done');
        expect(renderer.mount).toHaveBeenCalledTimes(1);
        expect(renderer.apply).toHaveBeenCalled();
        expect(renderer.finale).toHaveBeenCalled();
    });

    it('applies a swap by mutating values and emitting renderer.apply', async () => {
        const renderer = makeRenderer();
        const p = new Player({ renderer });
        await new Promise(resolve => {
            p.start([10, 20], (function* () { yield op.swap(0, 1); })(), { opsPerFrame: 10, onDone: resolve });
        });
        expect(p.values[0]).toBe(20);
        expect(p.values[1]).toBe(10);
    });

    it('reports counters to the supplied stats sink', async () => {
        const renderer = makeRenderer();
        const stats = makeStats();
        const p = new Player({ renderer, stats });
        await new Promise(resolve => {
            p.start([0, 0, 0], swapGen(), { opsPerFrame: 10, onDone: resolve });
        });
        expect(stats.reset).toHaveBeenCalled();
        expect(stats.swap).toHaveBeenCalledTimes(1);
        expect(stats.write).toHaveBeenCalledTimes(1);
    });

    it('forwards LINE ops via onLine and not to the renderer', async () => {
        const renderer = makeRenderer();
        const lines = [];
        const p = new Player({ renderer, onLine: n => lines.push(n) });
        await new Promise(resolve => {
            p.start([1], (function* () { yield op.line(3); yield op.line(7); })(),
                { opsPerFrame: 10, onDone: resolve });
        });
        expect(lines).toEqual([3, 7]);
        // LINE never reaches the renderer
        for (const call of renderer.apply.mock.calls) {
            expect(call[0].type).not.toBe('line');
        }
    });

    it('respects opsPerFrame as a per-tick budget', async () => {
        const renderer = makeRenderer();
        const p = new Player({ renderer });
        // 5 ops, 1 per frame → first tick processes exactly 1 op.
        p.start([0], bigGen(5), { opsPerFrame: 1 });
        await new Promise(r => setTimeout(r, 0));
        expect(renderer.apply.mock.calls.length).toBe(1);
        p.cancel();
    });

    it('cancel stops a running player', () => {
        const p = new Player({ renderer: makeRenderer() });
        p.start([0], bigGen(1000), { opsPerFrame: 1 });
        expect(p.state).toBe('running');
        p.cancel();
        expect(p.state).toBe('cancelled');
    });

    it('pause halts ticks; resume continues', async () => {
        const renderer = makeRenderer();
        const p = new Player({ renderer });
        const done = new Promise(resolve => {
            p.start([0], bigGen(20), { opsPerFrame: 1, onDone: resolve });
        });
        await new Promise(r => setTimeout(r, 0));
        p.pause();
        expect(p.state).toBe('paused');
        const appliedAtPause = renderer.apply.mock.calls.length;
        await new Promise(r => setTimeout(r, 5));
        expect(renderer.apply.mock.calls.length).toBe(appliedAtPause);
        p.resume();
        await done;
        expect(p.state).toBe('done');
    });

    it('step advances exactly one op while paused', async () => {
        const p = new Player({ renderer: makeRenderer() });
        p.start([0], bigGen(10), { opsPerFrame: 1 });
        await new Promise(r => setTimeout(r, 0));
        p.pause();
        const before = p.renderer.apply.mock.calls.length;
        p.step();
        expect(p.renderer.apply.mock.calls.length).toBe(before + 1);
    });
});

describe('Player scheduled mode', () => {
    it('plays a pre-collected op array to completion', async () => {
        const renderer = makeRenderer();
        const p = new Player({ renderer });
        const ops = [op.swap(0, 1), op.write(2, 7), op.compare(0, 2)];
        await new Promise(resolve => {
            p.startScheduled([1, 2, 3], ops, 30, { onDone: resolve });
        });
        expect(p.state).toBe('done');
        expect(renderer.mount).toHaveBeenCalledTimes(1);
        expect(renderer.finale).toHaveBeenCalledTimes(1);
        // Every visual op was emitted to the renderer.
        const visualCalls = renderer.apply.mock.calls.map(c => c[0]);
        expect(visualCalls).toHaveLength(3);
    });

    it('cancel clears scheduled ops', () => {
        const p = new Player({ renderer: makeRenderer() });
        p.startScheduled([0, 0], [op.compare(0, 1)], 1000);
        p.cancel();
        expect(p.state).toBe('cancelled');
    });

    it('step in scheduled mode advances exactly one op while paused', async () => {
        const renderer = makeRenderer();
        const p = new Player({ renderer });
        p.startScheduled([0, 0, 0], [op.compare(0, 1), op.compare(0, 2), op.compare(1, 2)], 10_000);
        // Paused immediately — scheduled progress is time-based, so by pausing
        // before any RAF tick we keep the index at 0.
        p.pause();
        expect(p.state).toBe('paused');
        const before = renderer.apply.mock.calls.length;
        p.step();
        p.step();
        expect(renderer.apply.mock.calls.length).toBe(before + 2);
    });
});
