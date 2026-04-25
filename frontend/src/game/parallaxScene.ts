/**
 * Parallax scene definitions. Each scene is a list of layers, ordered far → near.
 * Engine code lives in `parallax.ts`; this file is pure data.
 *
 * Scroll-factor cheat sheet (see docs/roadmap/11_PARALLAX.md §2):
 *   0.0   sky / static
 *   0.05  distant haze
 *   0.15  far ridges
 *   0.30  mid ridges
 *   0.55  near treeline
 *   0.75  ground fog
 *   1.0   world-locked
 */

import type { ParallaxScene } from './parallax';

export const FOREST_PARALLAX_SCENE: ParallaxScene = {
  id: 'forest-ruins',
  layers: [
    {
      kind: 'sky',
      id: 'forest-sky',
      topColor: '#0b2418',
      midColor: '#06140d',
      bottomColor: '#040906',
    },
    {
      kind: 'silhouette',
      id: 'forest-far-ridge',
      scroll: { sx: 0.08, sy: 0.04 },
      worldFloorY: 1400,
      height: 220,
      amplitude: 60,
      baseline: 90,
      color: 'rgba(10, 41, 27, 0.95)',
      seed: 0x5eed01,
      harmonics: 5,
    },
    {
      kind: 'silhouette',
      id: 'forest-mid-ridge',
      scroll: { sx: 0.18, sy: 0.07 },
      worldFloorY: 1000,
      height: 260,
      amplitude: 70,
      baseline: 110,
      color: 'rgba(7, 30, 19, 0.95)',
      seed: 0x5eed02,
      harmonics: 6,
    },
    {
      kind: 'fog',
      id: 'forest-mid-fog',
      scroll: { sx: 0.28, sy: 0.1 },
      worldFloorY: 700,
      height: 220,
      color: '#e7fdf5',
      alpha: 0.18,
      seed: 0x5eed03,
    },
    {
      kind: 'treeline',
      id: 'forest-treeline',
      scroll: { sx: 0.42, sy: 0.15 },
      worldFloorY: 520,
      height: 320,
      trunkSpacing: 120,
      trunkWidth: 18,
      canopyRadius: 90,
      color: 'rgba(4, 20, 12, 0.98)',
      seed: 0x5eed04,
    },
    {
      kind: 'fog',
      id: 'forest-near-fog',
      scroll: { sx: 0.62, sy: 0.22 },
      worldFloorY: 280,
      height: 200,
      color: '#cdeede',
      alpha: 0.12,
      seed: 0x5eed05,
    },
    {
      kind: 'noise',
      id: 'forest-noise',
      scroll: { sx: 0, sy: 0 },
      alpha: 0.06,
      density: 0.025,
      color: '#ffffff',
      seed: 0x5eed06,
    },
  ],
};
