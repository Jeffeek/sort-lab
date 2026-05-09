/**
 * Thin localStorage-backed key/value store. Falls back to in-memory if storage
 * is unavailable (private mode, file://, etc.).
 */
const KEY = 'sort-visualizer:v1';
let cache = null;

function load() {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { cache = {}; }
    return cache;
}

export const Settings = {
    get(key, fallback) {
        const v = load()[key];
        return v === undefined ? fallback : v;
    },
    set(key, value) {
        const c = load();
        c[key] = value;
        try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* ignore */ }
    },
};
