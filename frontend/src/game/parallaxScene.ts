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
 * Sewer / "égout" scene — small mouse stuck inside a brick storm-drain
 * tunnel with muddy water flowing through it. Reference image: 19th-century
 * Paris sewers (Service des Égouts). Palette is brown brick, dark warm
 * grey, ochre water — strictly no green.
 */
export const SEWER_PARALLAX_SCENE: ParallaxScene = {
  id: 'sewer-gutter',
  layers: [
    // 1) Back of the tunnel — almost black with a faint warm middle that
    //    reads as residual lamp glow on the curved ceiling.
    {
      kind: 'sky',
      id: 'sewer-sky',
      topColor: '#0a0807',
      midColor: '#171210',
      bottomColor: '#080605',
    },

    // 2) Brick back wall — drifts barely. The dominant 'we are inside a
    //    masonry tunnel' read; everything else is layered on top.
    {
      kind: 'brickWall',
      id: 'sewer-brick-wall',
      scroll: { sx: 0.06, sy: 0.03 },
      worldFloorY: 1100,
      height: 760,
      brickColor: '#4a3327',
      mortarColor: '#1a120e',
      stainColor: '#2a1a10',
      brickWidth: 56,
      brickHeight: 22,
      tonalJitter: 22,
      seed: 0x5e4e01,
    },

    // 3) Far arch silhouettes — the round-topped tunnel ribs receding into
    //    the back. Almost-black against the brick to read as deep shadow.
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
      color: '#0e0a08',
      highlightColor: '#3a2a20',
      seed: 0x5e4e02,
    },

    // 4) Mid grate — single grating panel between us and the back arches.
    //    Iron bars, rusted. Reinforces the "trapped inside" reading.
    {
      kind: 'grate',
      id: 'sewer-mid-grate',
      scroll: { sx: 0.34, sy: 0.13 },
      worldFloorY: 640,
      height: 440,
      barSpacing: 38,
      barThickness: 4,
      crossBarSpacing: 110,
      color: '#0e0c0a',
      rustColor: '#5a2f18',
      seed: 0x5e4e03,
    },

    // 5) Near arch — closer pipe rib framing the player. Smaller than
    //    before so it doesn't swallow the screen; sits flush with the
    //    floor so the visible top arches gently above the play area.
    {
      kind: 'arch',
      id: 'sewer-near-arch',
      scroll: { sx: 0.52, sy: 0.2 },
      worldFloorY: 480,
      height: 380,
      archSpacing: 720,
      archWidth: 480,
      archHeight: 340,
      pillarThickness: 64,
      color: '#080605',
      highlightColor: '#2c2018',
      seed: 0x5e4e04,
    },

    // 6) Water — animated muddy stream at the bottom of the tunnel.
    //    Brown base, ochre highlights, sy low so it stays visible during
    //    jumps; sx high so walking flows the surface under the mouse.
    {
      kind: 'water',
      id: 'sewer-water',
      scroll: { sx: 0.85, sy: 0.18 },
      worldFloorY: 60,
      height: 220,
      baseColor: '#3a2a1a',
      highlightColor: '#8c6a3e',
      rippleAmplitude: 7,
      frameCount: 8,
      frameDurationMs: 110,
      seed: 0x5e4e06,
    },

    // 7) Faint particulate dust — keeps everything from looking too crisp.
    {
      kind: 'noise',
      id: 'sewer-dust',
      scroll: { sx: 0, sy: 0 },
      alpha: 0.05,
      density: 0.012,
      color: '#d8c2a4',
      seed: 0x5e4e07,
    },
  ],
};
