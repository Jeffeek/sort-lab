/**
 * Seedable PRNG and array-distribution generator.
 *
 * `mulberry32` is a tiny, fast, well-distributed 32-bit PRNG — sufficient for
 * deterministic shuffles and reproducible runs. Distributions other than
 * "random" intentionally let through duplicates (fewUnique, sawtooth) or
 * imperfect ordering (nearlySorted) to surface algorithm-specific behavior.
 */

export function mulberry32(seed) {
    let s = seed >>> 0;
    return () => {
        s = (s + 0x6D2B79F5) | 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export const DISTRIBUTIONS = ['random', 'nearlySorted', 'reversed', 'fewUnique', 'sawtooth', 'gaussian'];

export const DISTRIBUTION_LABELS = {
    random:       'Random',
    nearlySorted: 'Nearly Sorted',
    reversed:     'Reversed',
    fewUnique:    'Few Unique',
    sawtooth:     'Sawtooth',
    gaussian:     'Gaussian',
};

function shuffle(a, rng) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

export function generateArray(size, distribution = 'random', seed = null) {
    if (seed === null || seed === undefined || Number.isNaN(seed)) {
        seed = (Math.random() * 0xFFFFFFFF) >>> 0;
    }
    const rng = mulberry32(seed);
    let a;
    switch (distribution) {
        case 'reversed':
            a = Array.from({ length: size }, (_, i) => size - i);
            break;
        case 'nearlySorted': {
            a = Array.from({ length: size }, (_, i) => i + 1);
            const swaps = Math.max(2, Math.floor(size * 0.05));
            for (let k = 0; k < swaps; k++) {
                const i = Math.floor(rng() * (size - 1));
                [a[i], a[i + 1]] = [a[i + 1], a[i]];
            }
            break;
        }
        case 'fewUnique': {
            const buckets = 5;
            const step = Math.max(1, Math.floor(size / buckets));
            a = Array.from({ length: size }, () => (1 + Math.floor(rng() * buckets)) * step);
            break;
        }
        case 'sawtooth': {
            const period = Math.max(2, Math.floor(Math.sqrt(size)));
            const step = Math.max(1, Math.floor(size / period));
            a = Array.from({ length: size }, (_, i) => ((i % period) + 1) * step);
            break;
        }
        case 'gaussian': {
            a = new Array(size);
            for (let i = 0; i < size; i++) {
                const u1 = Math.max(rng(), 1e-9);
                const u2 = rng();
                const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                a[i] = Math.max(1, Math.min(size, Math.round(size / 2 + (z * size) / 6)));
            }
            break;
        }
        case 'random':
        default:
            a = Array.from({ length: size }, (_, i) => i + 1);
            shuffle(a, rng);
    }
    return { values: a, seed };
}

export function isSorted(a) {
    for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
    return true;
}
