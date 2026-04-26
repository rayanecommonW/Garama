# Roadmap: Map Border & Beyond-Border Frame

> Companion to [11_PARALLAX.md](./11_PARALLAX.md). Parallax fills the world
> rect; this system fills the canvas area *outside* it and frames the world
> rect's visible edges.

## 1. Goal

The world is a 10000×10000 rect inside a much larger viewport (the canvas
can show beyond the world edges by up to 25% per side, controlled by
`BORDER_VISIBLE_FRACTION` in [camera.ts](../../frontend/src/game/camera.ts)).
We need that beyond-area to read as **physical bedrock the tunnel was
carved out of** — solid stone with cracks. No perspective tricks; the
border is a simple opaque object that happens to be cracked.

## 2. Approach

Two seamless cracked-stone tiles, baked once and cached in module scope:

- **`stoneTile`** — darker base. Tiles across the entire beyond-border ring
  via even-odd clip. No shear, no transform.
- **`facingTile`** — brighter base, slightly more crack density. Tiles into
  an `FACING_THICKNESS`-px strip hugging the OUTSIDE of every visible
  world rect edge. Reads as the inner face of the masonry — the visible
  edge of the wall, sitting one step closer to the viewer than the
  beyond-border field.

A 2-px black line on the exact world rect edge gives the boundary a hard
read regardless of which crack happens to land near it.

Both tiles live in [mapBorder.ts](../../frontend/src/game/mapBorder.ts).

## 3. Why no perspective

An earlier iteration used a cavalier shear on the beyond-border so the
masonry read as a 3D extrusion. Two problems with it: (a) the shear meant
the beyond-border was a "still image" that didn't track camera movement
naturally, (b) it competed visually with the parallax inside the world
rect. The current flat-fill version is simpler, reads as solid ground, and
stays out of the way.

## 4. Cracks

The cracks are baked into the tiles, not drawn per-frame:

- 14 main cracks per stone tile, 18 per facing tile.
- Each crack is a polyline of 6–13 segments, with a ~60% chance of a
  side-branch.
- Each crack is drawn at the tile origin **and at 8 wrap offsets**
  (`±tileW × ±tileH` combinations). Anything crossing a tile edge appears
  on the opposite edge — the tile is seamless in both axes.
- Half the cracks have a faint highlight stroke offset 1 px to give the
  cracks a bit of dimension.

Cracks therefore appear naturally near every world border edge because
they appear naturally everywhere — no need for an explicit "cracks
emanating from the border" pass.

## 5. Performance

- Two `bakeCrackedStoneTile` calls per session, ~5 ms total. Cached in
  module scope, never invalidated.
- Per-frame: one `createPattern` + one `fillRect` for the beyond-border.
  Frame: up to four `fillRect`s for the facing strips, plus one stroke for
  the edge line. ~6 fills total.
- When the camera is fully inside the world (no edges visible), the
  even-odd clip is empty and the frame's visibility checks all fail. No
  special-casing needed.

## 6. Extending

- **Different bedrock per biome.** Today both tiles are hard-coded.
  Easy extension: make `getStoneTile(biomeId)` keyed on the active biome,
  baking once per biome. Same for `getFacingTile`.
- **Cracks emanating from impacts.** If gameplay ever wants to leave a
  visible mark when, e.g., a charged attack lands on a wall, the
  bake-once approach won't fly. Add a separate per-frame procedural pass
  that draws an extra crack at the impact point (positions stored in
  game state, world-locked).
- **Asset-backed border.** When sprite layers land
  (see [12_PARALLAX_ASSETS.md](./12_PARALLAX_ASSETS.md)), the procedural
  bake becomes a hand-drawn PNG. Same render path.

## 7. Out of scope

- Beyond-border interaction with the player (climbing into the wall, etc.).
  The border is purely visual — collision is handled separately by the
  world's static objects.
- Animated beyond-border (rust drips, scuttling rats). Belongs in parallax
  as a low-Y, high-`sx` layer or in a future sprite-layer pass.
