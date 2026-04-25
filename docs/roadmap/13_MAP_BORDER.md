# Roadmap: Map Border & Beyond-Border Frame

> Companion to [11_PARALLAX.md](./11_PARALLAX.md). Parallax fills the world
> rect; this system fills the canvas area *outside* it and frames the world
> rect's visible edges.

## 1. Goal

The world is a 10000×10000 rect inside a much larger viewport (the canvas
can show beyond the world edges by up to 25% per side, controlled by
`BORDER_VISIBLE_FRACTION` in [camera.ts](../../frontend/src/game/camera.ts)).
We need that beyond-area to read as "the wall the tunnel was carved out of",
not as a flat black void.

## 2. Approach

A single brick tile (256 × 192, baked once and cached in module scope) is
filled into the canvas with two passes:

1. **Beyond-border** — `renderBeyondBorder(ctx, worldRect, viewport)`.
   Clip-out the world rect with even-odd fill rule, apply a cavalier shear
   (`transform(1, 0, -SHEAR, 1, 0, 0)` with `SHEAR = 0.35`), then fill the
   sheared brick pattern, a flat tint, and a radial vignette so the
   beyond-area reads as deeper into the masonry.

2. **Frame** — `renderMapBorderFrame(ctx, worldRect, viewport)`.
   Inner shadow strip just inside each visible world rect edge, plus a
   crisp 2-px line on the edge itself. Drawn *after* world objects and
   players so the play area is clearly delimited regardless of what's
   sitting on the boundary.

Both functions live in [mapBorder.ts](../../frontend/src/game/mapBorder.ts).

## 3. Why cavalier and not perspective

Cavalier projection (parallel, no foreshortening) is enough to read as 3D
in this context — full perspective would mean depth-keyed scaling and a
vanishing point, which is overkill for a "frame around a hole" effect. The
shear factor `0.35` is tuned by eye; lowering it makes the wall look thinner,
raising it makes it look like a sharper-angled inset.

The cavalier direction (back-of-wall shifts upper-right) is consistent
across all four sides — left and bottom regions don't get a strict
back-of-cube projection, but the uniform shear plus vignette+tint reads as
"masonry behind the level" rather than four mismatched walls.

## 4. Performance

- One `bakeBrickTile` call per session, ~3 ms on a desktop. Cached in module
  scope, never invalidated.
- Per-frame: one `createPattern` + one large `fillRect` (sheared) + one flat
  tint `fillRect` + one radial-gradient `fillRect`. ~4 fills total. Plus
  the frame: a few stroke calls only on visible edges.
- When the camera is fully inside the world (no edges visible), the
  even-odd clip degenerates to an empty region and all the fills become
  no-ops. No special-casing needed.

## 5. Extending

- **Different beyond-border per biome.** Today the brick tile is a single
  hard-coded palette. Easy extension: make `getBrickTile(biomeId)` keyed on
  the active biome, baking once per biome and caching all of them. The
  active biome tracks alongside the active parallax scene.
- **Asset-backed beyond-border.** When sprite layers land
  (see [12_PARALLAX_ASSETS.md](./12_PARALLAX_ASSETS.md)), the brick tile
  becomes a hand-drawn PNG instead of a procedural bake. Same render path.
- **Animated beyond-border** (e.g. flickering torchlight on the masonry).
  Same recipe as `water` in the parallax engine: bake N frames, pick by
  `performance.now() / frameDurationMs`.

## 6. Out of scope

- Free-cam mode visuals at extreme zooms — the shear and vignette are tuned
  for `zoom = 1`. Free cam still works; it just looks slightly off.
- Animated borders (rats running along the floor, rust drips). Belongs in
  parallax (low-Y, high-`sx` water-style layer) or sprite layers later, not
  here.
