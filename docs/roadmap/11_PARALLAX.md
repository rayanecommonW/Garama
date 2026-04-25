# Roadmap: Parallax Background

> Why this exists: the previous attempt on `feature/world-and-map-design` mixed
> ~500 lines of procedural background drawing directly into `renderer.ts`,
> redrew expensive sine-based silhouettes every frame, used screen-space wobble
> instead of true parallax depth, and used JS modulo with negative numbers
> (which produces negatives) for tiling — causing seams and jumps. This doc
> describes the rewrite.

## 1. Goal

Add a multi-layer background that:

- Reads as **depth** (closer layers move faster than the camera, far layers
  barely move) — the actual definition of parallax.
- Is **cheap per frame** — heavy procedural pieces (silhouettes, noise,
  tree-lines) are baked into offscreen canvases once, then blitted.
- Is **decoupled** from the world renderer — `renderer.ts` calls one function
  and never knows what layers exist.
- Is **data-driven** — adding a layer or building a new biome is editing a
  scene description, not editing render code.

## 2. Core Math

For each layer we have a per-axis **scroll factor** `(sx, sy)` in `[0, 1+]`:

- `0.0` → static (sky, gradient): the layer never moves.
- `~0.1` → very far (clouds, distant ridges).
- `~0.3` → mid (mountains, far trees).
- `~0.6` → near (treeline, fog band).
- `1.0` → world-locked (same speed as gameplay).
- `>1.0` → foreground (rare, e.g. blurred grass in front of the player).

Per-frame screen offset of a layer:

```
screenX = -cameraLeft * sx + anchorX
screenY =  cameraTop  * sy + anchorY
```

`cameraTop` is *added* (not subtracted) because the world is Y-up and the
canvas is Y-down — moving the camera up should pull a sky-anchored layer down
on screen.

For **horizontal infinite tiling** with a tile of width `W`:

```
wrapped = ((screenX % W) + W) % W   // safe modulo for negatives
draw tile at:  wrapped - W,  wrapped,  wrapped + W,  ... until viewport covered
```

The `((x % W) + W) % W` form is mandatory — JS `%` returns a negative for
negative inputs. This is the bug that broke the previous attempt's fog bands.

## 3. Architecture

Two files, one responsibility each:

```
frontend/src/game/parallax.ts        // engine: cache + draw
frontend/src/game/parallaxScene.ts   // data: which layers, what they look like
```

### `parallax.ts` (engine)

Exports:

- `type ParallaxLayer` — a layer description.
- `type ParallaxScene` — `{ skyGradient, layers }`.
- `renderParallax(ctx, scene, camera, viewport)` — draws the whole background.
- `clearParallaxCache()` — invalidate baked offscreen canvases (e.g. on
  viewport resize if a layer is anchored to viewport height).

Each layer is baked into an `OffscreenCanvas` (or a regular `<canvas>` as
fallback) the first time it is rendered, keyed by a stable `id`. Subsequent
frames are a single `drawImage` per visible tile copy — typically 2 to 3 per
layer.

### `parallaxScene.ts` (data)

A scene is just an array of layers ordered far → near. A layer is one of:

- **`sky`** — vertical 3-stop gradient, viewport-anchored. No tiling, no scroll.
- **`concreteWall`** — solid base + mossy patches + rust streaks + cracks.
  Tiled horizontally. Built for back-wall reads in confined-space scenes.
- **`silhouette`** — a soft wave silhouette generated from layered sine waves
  with deterministic seed. Tiled horizontally. Useful for canopies, ridges,
  organic skylines.
- **`arch`** — solid concrete strip with arched openings cut out via
  destination-out. Round-topped. Used for tunnel/pipe ribs at varied scroll
  factors to read as a receding corridor.
- **`grate`** — vertical bars + horizontal cross-bars + sparse rust spots.
  The "jail" reading.
- **`fog`** — soft horizontal band gradient with overlapping radial puffs.
  Reused for ground fog, slime drips, mist.
- **`water`** — animated, multi-frame strip. Dark base + bright surface
  highlights + 5 ripple bands; phase advances per frame. Tiled both axes.
- **`noise`** — sparse dot texture, used as a low-alpha pattern overlay.

All procedural pieces use a **seeded PRNG** (mulberry32) so the same scene
looks the same on every client and across reloads. No `Math.random()` in
content generation — that produced different backgrounds on each tile in the
old attempt.

For sprite/asset-backed layers (planned, not implemented), see
[12_PARALLAX_ASSETS.md](./12_PARALLAX_ASSETS.md).

## 5a. Animation

Layers may be animated by baking multiple frames instead of one. The cache
stores `frames: HTMLCanvasElement[]`; for static layers `frames.length === 1`.
At draw time the engine picks the active frame:

```
idx = floor(performance.now() / frameDurationMs) % frames.length
```

Currently only `water` opts in (8 frames × 110 ms = ~0.9 s flow loop). The
mechanism is generic — any baker that returns more than one canvas
participates automatically. To make a new layer animated:

1. Give its type a `frameCount: number` and `frameDurationMs: number`.
2. Make the baker return an array of canvases (one per frame), with the
   visual variation encoded by a per-frame phase value.
3. That's it — the cache, frame-picking, and draw paths already handle it.

For seamless looping the baker's frame-N+1 must equal frame-0, which falls
out naturally if you parameterise variation as `phase = (f / frameCount) * 2π`
and feed it into a sine.

## 4. Anchoring

A layer pins to one of:

- `world-floor` — y in world space (e.g. tree-line at `y = 0`). Scroll factor
  applied normally; far layers feel like they're behind the floor.
- `viewport-top` — pinned to the top of the viewport regardless of camera
  (e.g. sky gradient). Scroll factor is forced to `0` for sky.
- `viewport-bottom` — pinned to the bottom (e.g. ground fog).

Mixing world-anchored and viewport-anchored layers is what gives the scene
real depth — a pure viewport-anchored sky will never read as parallax because
nothing moves relative to it.

## 5. Caching

- Bake size for a tiled layer = `2 * viewportWidth` by layer height. Two
  viewport widths is enough for one wraparound at any scroll factor.
- Bake on first call. Re-bake when `viewportWidth` or `viewportHeight` exceeds
  the cached canvas (window resize larger).
- Re-baking is cheap *enough* that we don't try to be too clever. Don't bake
  per-camera-position offsets — that defeats the whole point of caching.

## 6. Where the previous attempt went wrong

Concrete checklist used to validate the rewrite:

| Old bug | Fix |
| --- | --- |
| Procedural silhouettes recomputed every frame from camera offset | Bake once into offscreen canvas, blit per frame |
| `(xOffset * 0.4 + i * 120) % 260` with negative `xOffset` → negative result | Use `((x % W) + W) % W` |
| `Math.random()` in noise tile only, but silhouette wave drew per-frame trig | All content generation uses seeded PRNG; no per-frame `Math.sin` loops |
| 500-line `renderer.ts` with parallax inlined | Two new files, `renderer.ts` just calls `renderParallax(...)` |
| Layers pinned to viewport with screen-space wobble (no real depth) | Layers pinned to world or viewport explicitly via `anchor` field with explicit scroll factors |

## 7. Adding a new biome

1. Add a `ParallaxScene` to `parallaxScene.ts`.
2. Pick layers, order far → near, choose scroll factors per the table in §2.
3. Reference it from `renderer.ts` (or, later, key by the active level's
   biome). No engine changes required.

## 8. Performance budget

- Frame cost: one `drawImage` per visible tile per layer. With 5 layers
  averaging 2 visible copies each = 10 `drawImage` calls per frame. Negligible
  on Canvas2D + GPU compositing.
- Memory: each layer ≈ `2 * viewportWidth * layerHeight * 4` bytes. At
  `1920 * 200 * 4` = 1.5 MB per layer, ~7.5 MB for 5 layers. Acceptable.
- If we ever switch to PixiJS (see [07_RENDERING_CHOICE.md](./07_RENDERING_CHOICE.md)),
  these baked canvases convert directly to `Texture.from(canvas)` and the
  scene-data file is reusable as-is.
