/**
 * Aggregator — imports every algorithm module and registers it. Adding a new
 * sort = drop a new file in this folder and add one import line below.
 */
import { Algorithms } from '../registry.js';

import bubble    from './bubble.js';
import cocktail  from './cocktail.js';
import gnome     from './gnome.js';
import insertion from './insertion.js';
import selection from './selection.js';
import shell     from './shell.js';
import comb      from './comb.js';
import quick     from './quick.js';
import merge     from './merge.js';
import heap      from './heap.js';
import tim       from './tim.js';
import intro     from './intro.js';
import radix     from './radix.js';
import counting  from './counting.js';
import bucket    from './bucket.js';
import pancake   from './pancake.js';
import bitonic   from './bitonic.js';
import bogo      from './bogo.js';

const ALL = [
    bubble, cocktail, gnome, insertion, selection, shell, comb,
    quick, merge, heap, tim, intro,
    radix, counting, bucket,
    pancake, bitonic, bogo,
];

for (const algo of ALL) Algorithms.register(algo);

export { Algorithms };
