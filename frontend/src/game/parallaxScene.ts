/**
 * Parallax scene definitions. Each scene is a list of layers, ordered far → near.
 * Engine code lives in `parallax.ts`; this file is pure data.
 *
 * Scroll-factor cheat sheet (see docs/roadmap/11_PARALLAX.md §2):
 *   0.0   sky / static
 *   0.05  back wall, very far
 *   0.20  far arches / silhouettes
 *   0.35  mid grates
 *   0.55  near pipe ribs
 *   0.85  flowing water (close, animated)
 *   1.0   world-locked
 */

import type { ParallaxScene } from './parallax';

/**
 * Sewer/gutter scene — small mouse trapped in a wet concrete pipe with a
 * stream of foul water running through it. Palette: dark grey concrete,
 * rust streaks, mossy rust-green slime, dim greenish water highlights.
 */
export const SEWER_PARALLAX_SCENE: ParallaxScene = {
  id: 'sewer-gutter',
  layers: [
    // 1) Back wall darkness — top→bottom slight gradient with a faintly
    //    brighter middle so it reads as a curved pipe interior.
    {
      kind: 'sky',
      id: 'sewer-sky',
      topColor: '#0a0d0c',
      midColor: '#1a201e',
      bottomColor: '#080a09',
    },

    // 2) Far concrete back wall — drifts barely. Patches of moss + rust
    //    streaks sit deep in the perspective.
    {
      kind: 'concreteWall',
      id: 'sewer-far-wall',
      scroll: { sx: 0.06, sy: 0.03 },
      worldFloorY: 1100,
      height: 760,
      baseColor: '#262a28',
      patchColor: '#3d5040',
      rustColor: '#5b3a25',
      seed: 0x5e4e01,
    },

    // 3) Far arch silhouettes — the round-topped tunnel ribs receding into
    //    the back. This is the dominant "we're inside a pipe" cue.
    {
      kind: 'arch',
      id: 'sewer-far-arch',
      scroll: { sx: 0.2, sy: 0.08 },
      worldFloorY: 820,
      height: 520,
      archSpacing: 360,
      archWidth: 240,
      archHeight: 460,
      pillarThickness: 36,
      color: '#1c211f',
      highlightColor: '#3a4640',
      seed: 0x5e4e02,
    },

    // 4) Mid grate — single grating panel between us and the back arches.
    //    Reinforces the "jail" reading without occluding the player.
    {
      kind: 'grate',
      id: 'sewer-mid-grate',
      scroll: { sx: 0.34, sy: 0.13 },
      worldFloorY: 640,
      height: 440,
      barSpacing: 38,
      barThickness: 4,
      crossBarSpacing: 110,
      color: '#171a18',
      rustColor: '#6b3a20',
      seed: 0x5e4e03,
    },

    // 5) Near arch — closer pipe rib. Bigger, sparser, occludes more of
    //    the screen edges so the centre frames the player.
    {
      kind: 'arch',
      id: 'sewer-near-arch',
      scroll: { sx: 0.52, sy: 0.2 },
      worldFloorY: 760,
      height: 660,
      archSpacing: 720,
      archWidth: 480,
      archHeight: 600,
      pillarThickness: 64,
      color: '#0e1110',
      highlightColor: '#33403a',
      seed: 0x5e4e04,
    },

    // 6) Slime drip band — mossy rust-green fog hugging the lower-mid area.
    //    Sits in front of the near arch so the moss reads as wet runoff.
    {
      kind: 'fog',
      id: 'sewer-slime-band',
      scroll: { sx: 0.55, sy: 0.22 },
      worldFloorY: 360,
      height: 240,
      color: '#3d5040',
      alpha: 0.32,
      seed: 0x5e4e05,
    },

    // 7) Water — animated stream at the bottom of the pipe.
    //    sy is low so the water stays visible during jumps; sx is close so
    //    walking left/right makes the surface flow under the mouse.
    {
      kind: 'water',
      id: 'sewer-water',
      scroll: { sx: 0.85, sy: 0.18 },
      worldFloorY: 60,
      height: 220,
      baseColor: '#1a2622',
      highlightColor: '#5a7a64',
      rippleAmplitude: 7,
      frameCount: 8,
      frameDurationMs: 110,
      seed: 0x5e4e06,
    },

    // 8) Faint particulate dust — keeps everything from looking too crisp.
    {
      kind: 'noise',
      id: 'sewer-dust',
      scroll: { sx: 0, sy: 0 },
      alpha: 0.04,
      density: 0.012,
      color: '#cdd5cb',
      seed: 0x5e4e07,
    },
  ],
};
