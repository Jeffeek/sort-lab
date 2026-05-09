/**
 * Algorithm registry. Algorithms self-register via `register(meta)`; the UI
 * builds its dropdown from `list()`. Adding a new sort never requires touching
 * UI or wiring code — register the algorithm, and it appears.
 *
 * @typedef {Object} Algorithm
 * @property {string} id                                  Stable identifier
 * @property {string} label                               UI display name
 * @property {{best:string, average:string, worst:string, space:string, stable:boolean}} [complexity]
 * @property {string[]} [pseudocode]                      Optional pseudocode lines (1-indexed via op.line)
 * @property {(arr:number[]) => Generator<import('./ops.js').Operation>} run
 */

const _registry = new Map();
const _order = [];

export const Algorithms = {
    /** @param {Algorithm} meta */
    register(meta) {
        if (!meta || !meta.id || typeof meta.run !== 'function') {
            throw new Error('Algorithm must define { id, run }');
        }
        if (!_registry.has(meta.id)) _order.push(meta.id);
        _registry.set(meta.id, {
            id: meta.id,
            label: meta.label || meta.id,
            complexity: meta.complexity || null,
            pseudocode: meta.pseudocode || null,
            run: meta.run,
        });
    },
    get: id => _registry.get(id),
    list: () => _order.map(id => _registry.get(id)),
};
