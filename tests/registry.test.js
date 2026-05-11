import { describe, it, expect, beforeEach, vi } from 'vitest';

// Registry is module-scoped state; reset between tests so cases stay isolated.
let Algorithms;
beforeEach(async () => {
    vi.resetModules();
    ({ Algorithms } = await import('../src/registry.js'));
});

const stub = (id, extra = {}) => ({
    id,
    label: extra.label ?? id.toUpperCase(),
    run: function* () {},
    ...extra,
});

describe('Algorithms.register', () => {
    it('stores label, complexity, pseudocode, run', () => {
        Algorithms.register({
            id: 'foo', label: 'Foo Sort',
            complexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)', space: 'O(1)', stable: true },
            pseudocode: ['a', 'b'],
            run: function* () { yield 1; },
        });
        const a = Algorithms.get('foo');
        expect(a.label).toBe('Foo Sort');
        expect(a.complexity.stable).toBe(true);
        expect(a.pseudocode).toEqual(['a', 'b']);
        expect(typeof a.run).toBe('function');
    });

    it('defaults label, complexity, and pseudocode when omitted', () => {
        Algorithms.register({ id: 'bare', run: function* () {} });
        const a = Algorithms.get('bare');
        expect(a.label).toBe('bare');
        expect(a.complexity).toBeNull();
        expect(a.pseudocode).toBeNull();
    });

    it('throws when id or run is missing', () => {
        expect(() => Algorithms.register({ run: function* () {} })).toThrow();
        expect(() => Algorithms.register({ id: 'x' })).toThrow();
        expect(() => Algorithms.register(null)).toThrow();
    });

    it('overwrites on re-register but does not duplicate the listing', () => {
        Algorithms.register(stub('a', { label: 'first' }));
        Algorithms.register(stub('a', { label: 'second' }));
        expect(Algorithms.get('a').label).toBe('second');
        expect(Algorithms.list().filter(x => x.id === 'a')).toHaveLength(1);
    });
});

describe('Algorithms.list', () => {
    it('preserves registration order', () => {
        Algorithms.register(stub('one'));
        Algorithms.register(stub('two'));
        Algorithms.register(stub('three'));
        expect(Algorithms.list().map(a => a.id)).toEqual(['one', 'two', 'three']);
    });

    it('is empty before any registration', () => {
        expect(Algorithms.list()).toEqual([]);
    });
});

describe('Algorithms.get', () => {
    it('returns undefined for unknown ids', () => {
        expect(Algorithms.get('nope')).toBeUndefined();
    });
});
