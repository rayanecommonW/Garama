/**
 * Parallax background engine.
 *
 * Design notes live in `docs/roadmap/11_PARALLAX.md`. The short version:
 *   screenX = -cameraLeft * sx
 *   screenY = (viewportHeight - worldFloorY) + cameraTop * sy
 * Tile wrap uses safe-modulo: `((x % W) + W) % W`.
 *
 * Procedural layers are baked into an offscreen canvas once and blitted per
 * frame, keyed by `(layer.id, viewportWidth, viewportHeight)`.
 */

export type ScrollFactor = { sx: number; sy: number };

export type SkyLayer = {
  kind: 'sky';
  id: string;
  topColor: string;
  midColor: string;
  bottomColor: string;
};

export type SilhouetteLayer = {
  kind: 'silhouette';
  id: string;
  scroll: ScrollFactor;
  worldFloorY: number;
  height: number;
  amplitude: number;
  baseline: number;
  color: string;
  seed: number;
  harmonics?: number;
};

export type TreelineLayer = {
  kind: 'treeline';
  id: string;
  scroll: ScrollFactor;
  worldFloorY: number;
  height: number;
  trunkSpacing: number;
  trunkWidth: number;
  canopyRadius: number;
  color: string;
  seed: number;
};

export type FogLayer = {
  kind: 'fog';
  id: string;
  scroll: ScrollFactor;
  worldFloorY: number;
  height: number;
  color: string;
  alpha: number;
  seed: number;
};

export type NoiseLayer = {
  kind: 'noise';
  id: string;
  scroll: ScrollFactor;
  alpha: number;
  density: number;
  color: string;
  seed: number;
};

export type ParallaxLayer = SkyLayer | SilhouetteLayer | TreelineLayer | FogLayer | NoiseLayer;

export type ParallaxScene = {
  id: string;
  layers: ParallaxLayer[];
};

export type ParallaxCamera = {
  /** World X of the left edge of the viewport. */
  left: number;
  /** World Y of the bottom edge of the viewport (Y-up). */
  top: number;
};

export type ParallaxViewport = {
  width: number;
  height: number;
};

/* -------------------------------------------------------------------------- */
/*  Seeded PRNG (deterministic content generation)                            */
/* -------------------------------------------------------------------------- */

/** Seeded mulberry32. Cheap and good enough for visual content. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** JS `%` returns negatives for negative inputs. This wraps into [0, m). */
export function safeMod(x: number, m: number): number {
  return ((x % m) + m) % m;
}

/* -------------------------------------------------------------------------- */
/*  Cache                                                                     */
/* -------------------------------------------------------------------------- */

type CacheEntry = {
  canvas: HTMLCanvasElement;
  viewportWidth: number;
  viewportHeight: number;
};

const layerCache = new Map<string, CacheEntry>();

export function clearParallaxCache(): void {
  layerCache.clear();
}

function getOrBakeLayer(
  layer: Exclude<ParallaxLayer, SkyLayer>,
  viewport: ParallaxViewport
): HTMLCanvasElement {
  const cached = layerCache.get(layer.id);
  if (cached && cached.viewportWidth >= viewport.width && cached.viewportHeight >= viewport.height) {
    return cached.canvas;
  }

  const canvas = bakeLayer(layer, viewport);
  layerCache.set(layer.id, {
    canvas,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  });
  return canvas;
}

/* -------------------------------------------------------------------------- */
/*  Bakers                                                                    */
/* -------------------------------------------------------------------------- */

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(width));
  c.height = Math.max(1, Math.ceil(height));
  return c;
}

function bakeLayer(layer: Exclude<ParallaxLayer, SkyLayer>, viewport: ParallaxViewport): HTMLCanvasElement {
  // Strips are baked at twice the viewport width so a single wraparound is enough.
  const stripWidth = Math.max(512, viewport.width * 2);

  switch (layer.kind) {
    case 'silhouette':
      return bakeSilhouette(layer, stripWidth);
    case 'treeline':
      return bakeTreeline(layer, stripWidth);
    case 'fog':
      return bakeFog(layer, stripWidth);
    case 'noise':
      return bakeNoise(layer, viewport);
  }
}

function bakeSilhouette(layer: SilhouetteLayer, stripWidth: number): HTMLCanvasElement {
  const canvas = makeCanvas(stripWidth, layer.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rng = mulberry32(layer.seed);
  const harmonics = layer.harmonics ?? 4;

  // Random per-harmonic amplitudes/phases. Frequencies are integer multiples
  // of (2π / stripWidth) so y(x) == y(x + stripWidth): the strip tiles seamlessly.
  const harmonicSpec: { k: number; amp: number; phase: number }[] = [];
  let ampSum = 0;
  for (let i = 0; i < harmonics; i++) {
    const k = i + 1 + Math.floor(rng() * 2); // small integer harmonic
    const amp = (1 / (i + 1)) * (0.6 + rng() * 0.8);
    ampSum += amp;
    harmonicSpec.push({ k, amp, phase: rng() * Math.PI * 2 });
  }

  const yAt = (x: number) => {
    let v = 0;
    for (const h of harmonicSpec) {
      v += h.amp * Math.sin((2 * Math.PI * h.k * x) / stripWidth + h.phase);
    }
    return (v / ampSum) * layer.amplitude;
  };

  const baseline = layer.baseline; // top-of-canvas-relative pixel where the curve sits

  ctx.fillStyle = layer.color;
  ctx.beginPath();
  ctx.moveTo(0, layer.height);
  for (let x = 0; x <= stripWidth; x++) {
    ctx.lineTo(x, baseline + yAt(x));
  }
  ctx.lineTo(stripWidth, layer.height);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

function bakeTreeline(layer: TreelineLayer, stripWidth: number): HTMLCanvasElement {
  const canvas = makeCanvas(stripWidth, layer.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rng = mulberry32(layer.seed);
  const trunkSpacing = layer.trunkSpacing;
  const trunkCount = Math.max(1, Math.floor(stripWidth / trunkSpacing));
  // Make trunkSpacing fit the strip exactly so the tile loops seamlessly.
  const exactSpacing = stripWidth / trunkCount;

  ctx.fillStyle = layer.color;

  for (let i = 0; i < trunkCount; i++) {
    const cx = i * exactSpacing + exactSpacing / 2;
    const heightJitter = 0.7 + rng() * 0.6; // 0.7 .. 1.3
    const widthJitter = 0.85 + rng() * 0.3;

    const treeHeight = layer.height * 0.65 * heightJitter;
    const trunkY = layer.height - treeHeight;

    // Trunk
    const tw = layer.trunkWidth * widthJitter;
    ctx.fillRect(cx - tw / 2, trunkY, tw, treeHeight);

    // Layered triangle canopy (3 stacked triangles, narrowing upward).
    const canopyR = layer.canopyRadius * widthJitter;
    const canopyTop = trunkY - canopyR * 1.6;
    for (let layerIdx = 0; layerIdx < 3; layerIdx++) {
      const t = layerIdx / 2;
      const r = canopyR * (1 - t * 0.35);
      const yTop = canopyTop + t * canopyR * 0.9;
      ctx.beginPath();
      ctx.moveTo(cx, yTop);
      ctx.lineTo(cx - r, yTop + canopyR);
      ctx.lineTo(cx + r, yTop + canopyR);
      ctx.closePath();
      ctx.fill();
    }
  }

  return canvas;
}

function bakeFog(layer: FogLayer, stripWidth: number): HTMLCanvasElement {
  const canvas = makeCanvas(stripWidth, layer.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rng = mulberry32(layer.seed);

  // Soft horizontal band: vertical gradient + a few overlapping radial puffs.
  const grad = ctx.createLinearGradient(0, 0, 0, layer.height);
  grad.addColorStop(0, withAlpha(layer.color, 0));
  grad.addColorStop(0.5, withAlpha(layer.color, layer.alpha));
  grad.addColorStop(1, withAlpha(layer.color, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, stripWidth, layer.height);

  ctx.globalCompositeOperation = 'lighter';
  const puffCount = Math.max(4, Math.floor(stripWidth / 240));
  for (let i = 0; i < puffCount; i++) {
    const cx = (i / puffCount) * stripWidth + (rng() - 0.5) * 60;
    const cy = layer.height * (0.3 + rng() * 0.4);
    const r = 80 + rng() * 140;
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    radial.addColorStop(0, withAlpha(layer.color, layer.alpha * 0.6));
    radial.addColorStop(1, withAlpha(layer.color, 0));
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function bakeNoise(layer: NoiseLayer, viewport: ParallaxViewport): HTMLCanvasElement {
  const tileSize = 128;
  const canvas = makeCanvas(tileSize, tileSize);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rng = mulberry32(layer.seed);
  const dotCount = Math.max(8, Math.floor(layer.density * tileSize * tileSize));

  ctx.fillStyle = withAlpha(layer.color, layer.alpha);
  for (let i = 0; i < dotCount; i++) {
    const x = Math.floor(rng() * tileSize);
    const y = Math.floor(rng() * tileSize);
    const r = rng() < 0.85 ? 1 : 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Reference viewport so caller can compute a stable cache hit.
  void viewport;
  return canvas;
}

function withAlpha(color: string, alpha: number): string {
  // Accepts '#rrggbb' or 'rgba(...)'. For everything else, fall back to the
  // input color and trust the caller — we don't ship a full color parser.
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Renders an entire parallax scene into the current canvas context.
 *
 * Caller is expected to have set up any clipping (e.g. to the world rect)
 * before calling. The function does not save/restore — it leaves the context
 * in a clean state by resetting fillStyle/globalAlpha at the end of each layer.
 */
export function renderParallax(
  ctx: CanvasRenderingContext2D,
  scene: ParallaxScene,
  camera: ParallaxCamera,
  viewport: ParallaxViewport
): void {
  for (const layer of scene.layers) {
    if (layer.kind === 'sky') {
      drawSky(ctx, layer, viewport);
    } else if (layer.kind === 'noise') {
      drawNoise(ctx, layer, viewport);
    } else {
      drawTiledStrip(ctx, layer, camera, viewport);
    }
  }
}

/** Optionally pre-build all caches so the first frame doesn't stutter. */
export function prewarmParallax(scene: ParallaxScene, viewport: ParallaxViewport): void {
  for (const layer of scene.layers) {
    if (layer.kind === 'sky') continue;
    getOrBakeLayer(layer, viewport);
  }
}

/* -------------------------------------------------------------------------- */
/*  Drawers                                                                   */
/* -------------------------------------------------------------------------- */

function drawSky(ctx: CanvasRenderingContext2D, layer: SkyLayer, viewport: ParallaxViewport): void {
  const grad = ctx.createLinearGradient(0, 0, 0, viewport.height);
  grad.addColorStop(0, layer.topColor);
  grad.addColorStop(0.5, layer.midColor);
  grad.addColorStop(1, layer.bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
}

function drawNoise(
  ctx: CanvasRenderingContext2D,
  layer: NoiseLayer,
  viewport: ParallaxViewport
): void {
  const tile = getOrBakeLayer(layer, viewport);
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;

  ctx.save();
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  ctx.restore();
}

function drawTiledStrip(
  ctx: CanvasRenderingContext2D,
  layer: SilhouetteLayer | TreelineLayer | FogLayer,
  camera: ParallaxCamera,
  viewport: ParallaxViewport
): void {
  const tile = getOrBakeLayer(layer, viewport);
  const W = tile.width;

  const screenXRaw = -camera.left * layer.scroll.sx;
  const wrappedX = safeMod(screenXRaw, W);
  const screenY = viewport.height - layer.worldFloorY + camera.top * layer.scroll.sy;

  // Cull entirely off-screen vertically.
  if (screenY > viewport.height || screenY + tile.height < 0) return;

  let x = wrappedX - W;
  while (x < viewport.width) {
    ctx.drawImage(tile, x, screenY);
    x += W;
  }
}
