/**
 * Parallax background engine.
 *
 * Design notes live in `docs/roadmap/11_PARALLAX.md`. Short version:
 *   screenX = -cameraLeft * sx
 *   screenY = (viewportHeight - worldFloorY) + cameraTop * sy
 * Tile wrap uses safe-modulo: `((x % W) + W) % W`.
 *
 * Procedural layers are baked into offscreen canvases. Static layers cache
 * one canvas; animated layers cache an array of frames keyed by
 * `(layer.id, viewportWidth, viewportHeight)` and pick the current frame
 * from `performance.now()`.
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

export type ConcreteWallLayer = {
  kind: 'concreteWall';
  id: string;
  scroll: ScrollFactor;
  worldFloorY: number;
  height: number;
  baseColor: string;
  patchColor: string;
  rustColor: string;
  seed: number;
};

export type ArchLayer = {
  kind: 'arch';
  id: string;
  scroll: ScrollFactor;
  worldFloorY: number;
  height: number;
  archSpacing: number;
  archWidth: number;
  archHeight: number;
  pillarThickness: number;
  color: string;
  highlightColor: string;
  seed: number;
};

export type GrateLayer = {
  kind: 'grate';
  id: string;
  scroll: ScrollFactor;
  worldFloorY: number;
  height: number;
  barSpacing: number;
  barThickness: number;
  crossBarSpacing: number;
  color: string;
  rustColor: string;
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

export type WaterLayer = {
  kind: 'water';
  id: string;
  scroll: ScrollFactor;
  worldFloorY: number;
  height: number;
  baseColor: string;
  highlightColor: string;
  rippleAmplitude: number;
  /** Number of pre-baked frames for the flow loop. 6–10 looks good. */
  frameCount: number;
  /** Milliseconds per frame. Higher = slower flow. */
  frameDurationMs: number;
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

export type ParallaxLayer =
  | SkyLayer
  | SilhouetteLayer
  | ConcreteWallLayer
  | ArchLayer
  | GrateLayer
  | FogLayer
  | WaterLayer
  | NoiseLayer;

/** Any layer that has a tiled, world-anchored strip with a scroll factor. */
type TiledLayer = SilhouetteLayer | ConcreteWallLayer | ArchLayer | GrateLayer | FogLayer | WaterLayer;

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
  frames: HTMLCanvasElement[];
  viewportWidth: number;
  viewportHeight: number;
};

const layerCache = new Map<string, CacheEntry>();

export function clearParallaxCache(): void {
  layerCache.clear();
}

function getOrBakeFrames(
  layer: Exclude<ParallaxLayer, SkyLayer>,
  viewport: ParallaxViewport
): HTMLCanvasElement[] {
  const cached = layerCache.get(layer.id);
  if (cached && cached.viewportWidth >= viewport.width && cached.viewportHeight >= viewport.height) {
    return cached.frames;
  }

  const frames = bakeLayer(layer, viewport);
  layerCache.set(layer.id, {
    frames,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  });
  return frames;
}

function pickFrame(layer: ParallaxLayer, frames: HTMLCanvasElement[], nowMs: number): HTMLCanvasElement {
  if (frames.length <= 1) return frames[0];
  // Animated layers are guaranteed to carry frameDurationMs by their type.
  const duration = (layer as WaterLayer).frameDurationMs;
  const idx = Math.floor(nowMs / duration) % frames.length;
  return frames[idx];
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

function bakeLayer(
  layer: Exclude<ParallaxLayer, SkyLayer>,
  viewport: ParallaxViewport
): HTMLCanvasElement[] {
  // Strips are baked at twice the viewport width so a single wraparound suffices.
  const stripWidth = Math.max(512, viewport.width * 2);

  switch (layer.kind) {
    case 'silhouette':
      return [bakeSilhouette(layer, stripWidth)];
    case 'concreteWall':
      return [bakeConcreteWall(layer, stripWidth)];
    case 'arch':
      return [bakeArch(layer, stripWidth)];
    case 'grate':
      return [bakeGrate(layer, stripWidth)];
    case 'fog':
      return [bakeFog(layer, stripWidth)];
    case 'water':
      return bakeWater(layer, stripWidth);
    case 'noise':
      return [bakeNoise(layer, viewport)];
  }
}

function bakeSilhouette(layer: SilhouetteLayer, stripWidth: number): HTMLCanvasElement {
  const canvas = makeCanvas(stripWidth, layer.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rng = mulberry32(layer.seed);
  const harmonics = layer.harmonics ?? 4;

  // Integer harmonic frequencies → y(x) == y(x + stripWidth) → seamless tile.
  const spec: { k: number; amp: number; phase: number }[] = [];
  let ampSum = 0;
  for (let i = 0; i < harmonics; i++) {
    const k = i + 1 + Math.floor(rng() * 2);
    const amp = (1 / (i + 1)) * (0.6 + rng() * 0.8);
    ampSum += amp;
    spec.push({ k, amp, phase: rng() * Math.PI * 2 });
  }

  const yAt = (x: number) => {
    let v = 0;
    for (const h of spec) {
      v += h.amp * Math.sin((2 * Math.PI * h.k * x) / stripWidth + h.phase);
    }
    return (v / ampSum) * layer.amplitude;
  };

  ctx.fillStyle = layer.color;
  ctx.beginPath();
  ctx.moveTo(0, layer.height);
  for (let x = 0; x <= stripWidth; x++) {
    ctx.lineTo(x, layer.baseline + yAt(x));
  }
  ctx.lineTo(stripWidth, layer.height);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

function bakeConcreteWall(layer: ConcreteWallLayer, stripWidth: number): HTMLCanvasElement {
  const canvas = makeCanvas(stripWidth, layer.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rng = mulberry32(layer.seed);

  // Solid base.
  ctx.fillStyle = layer.baseColor;
  ctx.fillRect(0, 0, stripWidth, layer.height);

  // Soft mossy patches (drawn three times so they wrap across the seam).
  const patchCount = Math.floor((stripWidth * layer.height) / 6000);
  for (let i = 0; i < patchCount; i++) {
    const px = rng() * stripWidth;
    const py = rng() * layer.height;
    const r = 30 + rng() * 80;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, withAlpha(layer.patchColor, 0.45));
    grad.addColorStop(1, withAlpha(layer.patchColor, 0));
    ctx.fillStyle = grad;
    drawWrapped(ctx, stripWidth, px, (x) => {
      ctx.fillRect(x - r, py - r, r * 2, r * 2);
    });
  }

  // Vertical rust streaks.
  const streakCount = Math.max(2, Math.floor(stripWidth / 220));
  for (let i = 0; i < streakCount; i++) {
    const x = rng() * stripWidth;
    const startY = rng() * layer.height * 0.25;
    const endY = layer.height;
    const grad = ctx.createLinearGradient(x, startY, x, endY);
    grad.addColorStop(0, withAlpha(layer.rustColor, 0));
    grad.addColorStop(0.4, withAlpha(layer.rustColor, 0.55));
    grad.addColorStop(1, withAlpha(layer.rustColor, 0.2));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1 + rng() * 2.5;
    drawWrapped(ctx, stripWidth, x, (xx) => {
      ctx.beginPath();
      ctx.moveTo(xx, startY);
      const drift = (rng() - 0.5) * 8;
      ctx.lineTo(xx + drift, endY);
      ctx.stroke();
    });
  }

  // Hairline cracks.
  ctx.strokeStyle = withAlpha('#000000', 0.45);
  ctx.lineWidth = 1;
  const crackCount = Math.max(2, Math.floor(stripWidth / 320));
  for (let i = 0; i < crackCount; i++) {
    const ox = rng() * stripWidth;
    const oy = rng() * layer.height;
    drawWrapped(ctx, stripWidth, ox, (originX) => {
      let x = originX;
      let y = oy;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segments = 3 + Math.floor(rng() * 4);
      for (let s = 0; s < segments; s++) {
        x += (rng() - 0.5) * 35;
        y += (rng() - 0.5) * 35;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }

  return canvas;
}

function bakeArch(layer: ArchLayer, stripWidth: number): HTMLCanvasElement {
  const canvas = makeCanvas(stripWidth, layer.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const archCount = Math.max(1, Math.round(stripWidth / layer.archSpacing));
  const exactSpacing = stripWidth / archCount;

  // Fill solid, then carve the archway openings out with destination-out.
  ctx.fillStyle = layer.color;
  ctx.fillRect(0, 0, stripWidth, layer.height);

  const archHalfW = layer.archWidth / 2;
  const archCapY = layer.height - layer.archHeight + archHalfW;

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  for (let i = 0; i < archCount; i++) {
    const cx = i * exactSpacing + exactSpacing / 2;
    ctx.beginPath();
    ctx.moveTo(cx - archHalfW, layer.height);
    ctx.lineTo(cx - archHalfW, archCapY);
    // Anticlockwise arc from PI to 0 sweeps through the top (canvas Y-down).
    ctx.arc(cx, archCapY, archHalfW, Math.PI, 0, true);
    ctx.lineTo(cx + archHalfW, layer.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Inner edge highlight runs around each archway.
  ctx.strokeStyle = layer.highlightColor;
  ctx.lineWidth = 2;
  for (let i = 0; i < archCount; i++) {
    const cx = i * exactSpacing + exactSpacing / 2;
    ctx.beginPath();
    ctx.moveTo(cx - archHalfW, layer.height);
    ctx.lineTo(cx - archHalfW, archCapY);
    ctx.arc(cx, archCapY, archHalfW, Math.PI, 0, true);
    ctx.lineTo(cx + archHalfW, layer.height);
    ctx.stroke();
  }

  return canvas;
}

function bakeGrate(layer: GrateLayer, stripWidth: number): HTMLCanvasElement {
  const canvas = makeCanvas(stripWidth, layer.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rng = mulberry32(layer.seed);

  const barCount = Math.max(2, Math.round(stripWidth / layer.barSpacing));
  const exactBarSpacing = stripWidth / barCount;
  const crossCount = Math.max(1, Math.round(layer.height / layer.crossBarSpacing));
  const exactCrossSpacing = layer.height / crossCount;

  ctx.fillStyle = layer.color;
  for (let i = 0; i < barCount; i++) {
    const x = i * exactBarSpacing - layer.barThickness / 2;
    ctx.fillRect(x, 0, layer.barThickness, layer.height);
  }
  for (let j = 0; j <= crossCount; j++) {
    const y = j * exactCrossSpacing - layer.barThickness / 2;
    ctx.fillRect(0, y, stripWidth, layer.barThickness);
  }

  // Sparse rust/grime spots so it doesn't read as a clean fence.
  const spotCount = Math.floor(stripWidth / 60);
  for (let i = 0; i < spotCount; i++) {
    const sx = rng() * stripWidth;
    const sy = rng() * layer.height;
    const r = 1 + rng() * 2;
    ctx.fillStyle = withAlpha(layer.rustColor, 0.35 + rng() * 0.3);
    drawWrapped(ctx, stripWidth, sx, (xx) => {
      ctx.beginPath();
      ctx.arc(xx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  return canvas;
}

function bakeFog(layer: FogLayer, stripWidth: number): HTMLCanvasElement {
  const canvas = makeCanvas(stripWidth, layer.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rng = mulberry32(layer.seed);

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
    radial.addColorStop(0, withAlpha(layer.color, layer.alpha * 0.65));
    radial.addColorStop(1, withAlpha(layer.color, 0));
    ctx.fillStyle = radial;
    drawWrapped(ctx, stripWidth, cx, (xx) => {
      ctx.beginPath();
      ctx.arc(xx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.globalCompositeOperation = 'source-over';

  return canvas;
}

function bakeWater(layer: WaterLayer, stripWidth: number): HTMLCanvasElement[] {
  const rng = mulberry32(layer.seed);

  // Pre-pick ripple harmonics. Integer k → seamless horizontal tile.
  const ripples: { k: number; amp: number; phase: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const k = i + 2 + Math.floor(rng() * 3);
    const amp = (0.6 + rng() * 0.5) / (i + 1);
    const phase = rng() * Math.PI * 2;
    ripples.push({ k, amp, phase });
  }

  const frames: HTMLCanvasElement[] = [];
  for (let f = 0; f < layer.frameCount; f++) {
    const flowPhase = (f / layer.frameCount) * Math.PI * 2;
    frames.push(bakeWaterFrame(layer, stripWidth, ripples, flowPhase));
  }
  return frames;
}

function bakeWaterFrame(
  layer: WaterLayer,
  stripWidth: number,
  ripples: { k: number; amp: number; phase: number }[],
  flowPhase: number
): HTMLCanvasElement {
  const canvas = makeCanvas(stripWidth, layer.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Deep base.
  ctx.fillStyle = layer.baseColor;
  ctx.fillRect(0, 0, stripWidth, layer.height);

  // Surface highlight gradient — brighter near the top of the strip.
  const grad = ctx.createLinearGradient(0, 0, 0, layer.height);
  grad.addColorStop(0, withAlpha(layer.highlightColor, 0.55));
  grad.addColorStop(0.35, withAlpha(layer.highlightColor, 0.12));
  grad.addColorStop(1, withAlpha(layer.highlightColor, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, stripWidth, layer.height);

  // Animated ripple bands. Multiple parallel bands at decreasing alpha read
  // as flowing water under low light.
  ctx.strokeStyle = layer.highlightColor;
  ctx.lineWidth = 1.5;

  const bandCount = 5;
  for (let band = 0; band < bandCount; band++) {
    const yBase = 6 + band * 10;
    const phaseOffset = band * 0.7;
    ctx.globalAlpha = 0.45 - band * 0.07;

    ctx.beginPath();
    for (let x = 0; x <= stripWidth; x += 6) {
      let dy = 0;
      for (const r of ripples) {
        dy += r.amp * Math.sin((2 * Math.PI * r.k * x) / stripWidth + r.phase + flowPhase + phaseOffset);
      }
      const py = yBase + dy * layer.rippleAmplitude * 0.5;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  return canvas;
}

function bakeNoise(layer: NoiseLayer, _viewport: ParallaxViewport): HTMLCanvasElement {
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

  return canvas;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Draw a feature centered near `x` such that any portion overflowing the
 * strip's left/right edge wraps to the opposite edge. Use for any baker that
 * places random elements — it's how we keep the seam invisible.
 */
function drawWrapped(
  _ctx: CanvasRenderingContext2D,
  stripWidth: number,
  x: number,
  draw: (offsetX: number) => void
): void {
  draw(x);
  draw(x + stripWidth);
  draw(x - stripWidth);
}

function withAlpha(color: string, alpha: number): string {
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
 * before calling. Reads `performance.now()` to advance animated layers.
 */
export function renderParallax(
  ctx: CanvasRenderingContext2D,
  scene: ParallaxScene,
  camera: ParallaxCamera,
  viewport: ParallaxViewport
): void {
  const nowMs = performance.now();

  for (const layer of scene.layers) {
    if (layer.kind === 'sky') {
      drawSky(ctx, layer, viewport);
    } else if (layer.kind === 'noise') {
      drawNoise(ctx, layer, viewport);
    } else {
      drawTiledStrip(ctx, layer, camera, viewport, nowMs);
    }
  }
}

/** Optionally pre-build all caches so the first frame doesn't stutter. */
export function prewarmParallax(scene: ParallaxScene, viewport: ParallaxViewport): void {
  for (const layer of scene.layers) {
    if (layer.kind === 'sky') continue;
    getOrBakeFrames(layer, viewport);
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
  const tile = getOrBakeFrames(layer, viewport)[0];
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;

  ctx.save();
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  ctx.restore();
}

function drawTiledStrip(
  ctx: CanvasRenderingContext2D,
  layer: TiledLayer,
  camera: ParallaxCamera,
  viewport: ParallaxViewport,
  nowMs: number
): void {
  const frames = getOrBakeFrames(layer, viewport);
  const tile = pickFrame(layer, frames, nowMs);
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
