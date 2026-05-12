/**
 * Single source of truth for the renderer registry. Adding a new visual means:
 * (1) write its module, (2) add an entry here. The UI selects in app.js and
 * pane.js both build their dropdowns from this list.
 */
import { BarRenderer }      from './bar.js';
import { CircularRenderer } from './circular.js';
import { DotRenderer }      from './dot.js';
import { HeatmapRenderer }  from './heatmap.js';
import { PyramidRenderer }  from './pyramid.js';
import { LineRenderer }     from './line.js';
import { SpiralRenderer }   from './spiral.js';

export const RENDERERS = {
    bar:      { label: 'Bars',     ctor: BarRenderer      },
    circular: { label: 'Circular', ctor: CircularRenderer },
    dot:      { label: 'Dots',     ctor: DotRenderer      },
    heatmap:  { label: 'Heatmap',  ctor: HeatmapRenderer  },
    pyramid:  { label: 'Pyramid',  ctor: PyramidRenderer  },
    line:     { label: 'Line',     ctor: LineRenderer     },
    spiral:   { label: 'Spiral',   ctor: SpiralRenderer   },
};

export const DEFAULT_RENDERER = 'bar';
