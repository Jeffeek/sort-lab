import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Settings caches reads in a module-scoped variable; reset between tests so
// state from one case doesn't leak into the next.
function makeLocalStorage() {
    const store = new Map();
    return {
        getItem: vi.fn(k => (store.has(k) ? store.get(k) : null)),
        setItem: vi.fn((k, v) => { store.set(k, String(v)); }),
        removeItem: vi.fn(k => store.delete(k)),
        _store: store,
    };
}

async function loadSettings() {
    vi.resetModules();
    const mod = await import('../src/settings.js');
    return mod.Settings;
}

afterEach(() => {
    delete globalThis.localStorage;
});

describe('Settings with localStorage available', () => {
    let storage;
    beforeEach(() => {
        storage = makeLocalStorage();
        globalThis.localStorage = storage;
    });

    it('returns fallback when key is missing', async () => {
        const Settings = await loadSettings();
        expect(Settings.get('missing', 'fb')).toBe('fb');
        expect(Settings.get('missing')).toBeUndefined();
    });

    it('persists set values to localStorage as JSON', async () => {
        const Settings = await loadSettings();
        Settings.set('size', 200);
        Settings.set('mode', 'compare');
        const raw = storage._store.get('sort-visualizer:v1');
        expect(JSON.parse(raw)).toEqual({ size: 200, mode: 'compare' });
    });

    it('reads back what was written', async () => {
        const Settings = await loadSettings();
        Settings.set('algo', 'quick');
        expect(Settings.get('algo')).toBe('quick');
    });

    it('handles malformed stored JSON by treating storage as empty', async () => {
        storage._store.set('sort-visualizer:v1', '{not json');
        const Settings = await loadSettings();
        expect(Settings.get('whatever', 'fb')).toBe('fb');
    });
});

describe('Settings without localStorage', () => {
    it('falls back to in-memory and survives within a session', async () => {
        // No localStorage on globalThis — Settings should still work.
        const Settings = await loadSettings();
        Settings.set('size', 42);
        expect(Settings.get('size')).toBe(42);
    });
});
