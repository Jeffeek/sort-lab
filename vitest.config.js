import { defineConfig } from 'vitest/config';

// Single test file with a small matrix — use a single fork to avoid spawning
// a pool worker per test. Hard test timeout guards against any algorithm
// regression that could spin (notably bogo).
export default defineConfig({
    test: {
        pool: 'forks',
        poolOptions: { forks: { singleFork: true, minForks: 1, maxForks: 1 } },
        testTimeout: 5000,
        hookTimeout: 5000,
        fileParallelism: false,
    },
});
