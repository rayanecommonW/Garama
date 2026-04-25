---
name: parallax-2d
description: Build or extend the 2D parallax background system in this repo (Canvas2D, Y-up world). Use when adding biomes, new layers, debugging seams/jumps, or porting parallax to PixiJS.
---

# 2D Parallax Skill (Garama)

Use this skill when the user asks to add, change, or debug parallax
backgrounds in `frontend/src/game/`.

Read first: [docs/roadmap/11_PARALLAX.md](../../../docs/roadmap/11_PARALLAX.md).
Engine entry point: `frontend/src/game/parallax.ts`. Scene data:
`frontend/src/game/parallaxScene.ts`.

## What "parallax" means here

Layers move at fractions of the camera. A *scroll factor* `s ∈ [0, 1+]`
multiplies camera displacement to produce layer screen position:

```
screenX = -cameraLeft * sx + anchorX
screenY =  cameraTop  * sy + anchorY     // note: + because world is Y-up
```

`0` = static (sky). `1` = world-locked. `>1` = foreground (rare).

## Hard rules

1. **Never use `x % W` for tile wrapping** — JS modulo is signed. Always use
   `((x % W) + W) % W`. This was the bug on `feature/world-and-map-design`.
2. **Never call `Math.random()` inside layer content generation.** Use the
   seeded `mulberry32` PRNG that lives in `parallax.ts`. Backgrounds must be
   deterministic across clients and reloads.
3. **Bake procedural layers into an offscreen canvas once** and blit. Per
   frame must be `drawImage`, not `for (...) ctx.lineTo(...)`.
4. **Y-up world, Y-down canvas.** When in doubt, run the local player
   horizontally first to confirm horizontal parallax reads correctly, then
   jump to confirm vertical doesn't invert.
5. **Don't inline parallax into `renderer.ts`.** It calls one function:
   `renderParallax(ctx, scene, camera, viewport)`. Keep it that way.

## Adding a new layer to an existing scene

1. Pick a scroll factor from §2 of `11_PARALLAX.md`.
2. Add a `ParallaxLayer` object to the scene array in `parallaxScene.ts`.
3. If it's a new *kind* of layer (not gradient/silhouette/treeline/fog/noise),
   add a baker in `parallax.ts` and a discriminator in the `ParallaxLayer`
   union.

## Adding a whole new biome

1. Add a new exported `ParallaxScene` to `parallaxScene.ts`.
2. Reuse layer kinds where possible; only add new bakers if the visual
   genuinely cannot be expressed as a tinted variant.
3. If/when level-aware: key the active scene off the current level/biome
   identifier rather than hard-coding in `renderer.ts`.

## Debugging checklist

- **Seam every N pixels** → tile width mismatch between bake size and the
  draw loop. Check `tile.width` vs `step` in `drawTiledLayer`.
- **Layer jumps when crossing world origin** → unsafe modulo. Grep for `% `
  in `parallax.ts`.
- **Background looks identical regardless of camera move** → layer is
  viewport-anchored with `sx = 0`. Either intentional (sky) or wrong
  (mountains): set `sx > 0`.
- **CPU spike on a fresh canvas** → first-frame bake. Pre-warm with
  `prewarmParallax(scene, viewport)` from the game loop's load step if it
  matters.

## Porting to PixiJS later

`bakeLayer(...)` returns a regular `HTMLCanvasElement`. PixiJS accepts those
with `Texture.from(canvas)`. The scene-data file (`parallaxScene.ts`) is
renderer-agnostic; only `parallax.ts` would change.

## Things to NOT do

- Don't add per-frame `Math.sin` loops to layers — bake the curve into the
  offscreen canvas instead.
- Don't compute layer width from `viewportWidth` and forget to re-bake on
  resize. The cache key must include viewport size.
- Don't re-introduce screen-space "wobble" or breathing — that breaks the
  illusion that layers are physically positioned in world space.
- Don't bundle this with LDtk/world-design changes. Parallax is purely a
  rendering concern; world content lives elsewhere.
