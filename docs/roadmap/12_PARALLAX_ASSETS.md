# Roadmap: Sprite-Backed Parallax Layers

> Companion to [11_PARALLAX.md](./11_PARALLAX.md). Procedural layers
> (silhouette / arch / grate / water / fog / noise / concreteWall) cover the
> aesthetic ground truth, but eventually we'll want to drop in hand-drawn
> assets — pipes, machinery, broken signs, larger animated set-pieces. This
> doc describes the *contract* for adding sprite-based layers without
> destabilising the engine.
>
> **Status: design, not implemented.** Do not write code from this doc — it
> documents the shape of a future change.

## 1. Why sprites at all

Procedural layers scale to "any width" for free and stay deterministic, but
they hit a wall as soon as we want:

- Recognisable, asymmetric objects (a busted ladder, a broken pipe, a sign).
- Hand-drawn detail — moss runs, light beams, character-pixel-grid art.
- Multi-frame animation richer than one ripple loop (e.g. a flickering bulb).

For all of those, the right input is a `.png` file someone drew, not a
seeded PRNG.

## 2. Two new layer kinds

Both extend the existing `ParallaxLayer` discriminated union in
`frontend/src/game/parallax.ts`. Their scroll/anchor semantics match every
other layer (`scroll: ScrollFactor`, `worldFloorY`, etc.). The only thing
that changes is *where the pixels come from*.

### `kind: 'sprite'`

Single-image, scattered placements along the strip.

```ts
type SpriteLayer = {
  kind: 'sprite';
  id: string;
  scroll: ScrollFactor;
  worldFloorY: number;
  height: number;
  src: string;             // path under /public/parallax/
  /** Repeat count per stripWidth. 1 = single placement, N = scattered. */
  count: number;
  /** [0..1) jitter applied to each placement's X within its slot. */
  xJitter: number;
  /** Optional vertical jitter in pixels. */
  yJitter: number;
  /** Optional tint (multiply blend). */
  tint?: string;
  seed: number;
};
```

The baker loads `src`, waits for `decode()`, then draws the image into the
strip canvas at `count` evenly-spaced slots with deterministic jitter. The
strip is otherwise transparent so the layer behind shows through.

### `kind: 'spriteSheet'`

Multi-frame animated sprite strip — the asset version of the existing
procedural `water` layer.

```ts
type SpriteSheetLayer = {
  kind: 'spriteSheet';
  id: string;
  scroll: ScrollFactor;
  worldFloorY: number;
  height: number;
  src: string;             // single PNG with frames laid out horizontally
  frameWidth: number;
  frameCount: number;
  frameDurationMs: number;
  /** How many tiled placements per stripWidth. */
  count: number;
  xJitter: number;
  seed: number;
};
```

The baker slices the sheet into `frameCount` strip frames (one strip per
animation frame), exactly like the `water` baker but with slices of an image
instead of generated ripples. The cache, frame-picking, and draw paths
already handle this — we just plug in a different baker.

## 3. Asset layout

```
frontend/public/parallax/
  <scene-id>/
    <layer-id>.png                # for SpriteLayer
    <layer-id>.sheet.png          # for SpriteSheetLayer
```

Concrete examples for the sewer scene:

```
frontend/public/parallax/sewer-gutter/
  pipe-junction.png
  broken-ladder.png
  flickering-bulb.sheet.png
```

The folder name matches `ParallaxScene.id` — we already key the scene by
that ID, so it's a natural namespace. Each layer's `id` is its filename
stem; the engine builds the full URL from `(scene.id, layer.id)` so the
scene definition only carries the layer id, not the path.

## 4. Loading & determinism contract

Async work has to stay invisible to the render loop:

- The engine only paints a sprite layer once `Image.decode()` resolves.
  Until then, the layer is a no-op (other layers still render). No spinners
  on the canvas.
- `prewarmParallax(scene, viewport)` becomes async-aware: it kicks off all
  image loads and resolves once they're ready. Game-state load step awaits
  it before showing the first frame, identical to how we currently
  instantiate textures.
- Procedural layers stay synchronous — no behaviour change for the existing
  scene. Sprite layers are strictly additive.
- Determinism: jitter and placement still use mulberry32 from `parallax.ts`.
  Asset *contents* are deterministic by virtue of being a static file.

## 5. Authoring rules for the artists

- **Trim the canvas to the sprite's bounding box.** Empty pixels are wasted
  texture memory at runtime.
- **PNG with straight (un-premultiplied) alpha.** Photoshop and Aseprite
  both default to this.
- **Power-of-two dimensions are not required** for Canvas2D, but keep
  individual files under 4096 px on either axis.
- **No half-tile detail at sheet boundaries.** A `.sheet.png` is sliced on
  exact `frameWidth` boundaries — anything bleeding across a frame boundary
  shows up as ghosting at runtime.
- **Match the scene palette.** A bright sprite in a muted scene reads as a
  bug, not a feature. If the artist wants to override, request a `tint`
  attribute on the layer in PR review rather than editing the source PNG.

## 6. When to prefer procedural vs sprite

| Need                             | Pick |
| -------------------------------- | --- |
| Long, repeating, abstract texture| procedural (`concreteWall`, `silhouette`) |
| One-of-a-kind landmark           | sprite |
| Subtle motion (water, fog)       | procedural (faster to iterate, no asset round-trip) |
| Specific animation (lights, gears, falling drips) | spriteSheet |
| Uncertain — still iterating colour | procedural until the look locks |

Don't reach for a sprite as the first move. Procedural layers compose with
the existing palette/seed machinery for free; sprites force an art request
into the loop.

## 7. PixiJS porting note

If/when we move to PixiJS (see [07_RENDERING_CHOICE.md](./07_RENDERING_CHOICE.md)):

- `SpriteLayer` becomes a `TilingSprite` or a `Container` of `Sprite`s.
- `SpriteSheetLayer` becomes an `AnimatedSprite` per tile copy.
- The scene-data file (`parallaxScene.ts`) stays unchanged. Only the engine
  changes.

## 8. Out of scope for this doc

- Per-pixel destruction / dynamic edits to a sprite layer (e.g. graffiti
  the player can spray onto the wall). That's a different system —
  parallax stays read-only.
- Lighting interactions (a torch the player carries shading the sprite).
  That belongs to a future `lighting.ts`, not the parallax engine.
- LDtk integration. Sprite layers are static placement of art *behind* the
  level. Foreground props that the level designer arranges per-room go
  through whatever LDtk pipeline we land on, not through this engine.
