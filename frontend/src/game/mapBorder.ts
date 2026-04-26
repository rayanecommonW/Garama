/**
 * Map border / beyond-the-world frame.
 *
 * Two responsibilities:
 *   1. Fill the canvas area OUTSIDE the world rect with a solid cracked-stone
 *      texture — reads as physical bedrock the world is carved into. No
 *      perspective, no shear, just opaque masonry.
 *   2. Draw a chunky textured "facing" strip on the world rect's visible
 *      edges so the boundary reads as a solid wall, not a one-pixel line.
 *
 * Coordinates are in the same "effective viewport" space as the rest of
 * the renderer (i.e. inside `ctx.scale(zoom, zoom)`).
 */

import { mulberry32 } from './parallax';

export type WorldRectOnScreen = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type CanvasViewport = {
  width: number;
  height: number;
};

/* -------------------------------------------------------------------------- */
/*  Cracked stone tile cache                                                  */
/* -------------------------------------------------------------------------- */

let stoneTile: HTMLCanvasElement | null = null;
let facingTile: HTMLCanvasElement | null = null;

function getStoneTile(): HTMLCanvasElement {
  if (stoneTile) return stoneTile;
  stoneTile = bakeCrackedStoneTile({
    width: 320,
    height: 240,
    baseColor: '#23211f',
    crackColor: '#070605',
    highlightColor: '#3a3633',
    seed: 0xc4ac4a,
    crackCount: 14,
  });
  return stoneTile;
}

function getFacingTile(): HTMLCanvasElement {
  if (facingTile) return facingTile;
  // The facing strip uses the same recipe but a hair brighter so the rim
  // reads as the lit edge of the stone, sitting in front of the rest.
  facingTile = bakeCrackedStoneTile({
    width: 320,
    height: 240,
    baseColor: '#312d2a',
    crackColor: '#0a0807',
    highlightColor: '#4a443f',
    seed: 0xc4ac4b,
    crackCount: 18,
  });
  return facingTile;
}

/** Manual reset hook for tests / hot reload. */
export function clearMapBorderCache(): void {
  stoneTile = null;
  facingTile = null;
}

type StoneTileSpec = {
  width: number;
  height: number;
  baseColor: string;
  crackColor: string;
  highlightColor: string;
  crackCount: number;
  seed: number;
};

function bakeCrackedStoneTile(spec: StoneTileSpec): HTMLCanvasElement {
  const { width: W, height: H } = spec;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rng = mulberry32(spec.seed);

  // Solid base.
  ctx.fillStyle = spec.baseColor;
  ctx.fillRect(0, 0, W, H);

  // Tonal patches — random radial gradients give the "weathered concrete"
  // mottling without looking obviously procedural.
  const patchCount = 70;
  for (let i = 0; i < patchCount; i++) {
    const px = rng() * W;
    const py = rng() * H;
    const r = 18 + rng() * 40;
    const dark = rng() < 0.5;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, dark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 240, 220, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    drawWrapped(W, H, px, py, (x, y) => {
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
  }

  // Cracks — jagged dark veins. Each crack is a polyline with a small chance
  // of a side-branch. Wrapped at the seam so the tile is seamless.
  for (let i = 0; i < spec.crackCount; i++) {
    const startX = rng() * W;
    const startY = rng() * H;
    const segments = 6 + Math.floor(rng() * 7);
    const stepLen = 7 + rng() * 14;
    const baseAngle = rng() * Math.PI * 2;
    const lineWidth = 0.6 + rng() * 1.6;

    drawCrack(ctx, W, H, startX, startY, segments, stepLen, baseAngle, lineWidth, spec.crackColor, rng);

    // Side branch starting roughly mid-crack.
    if (rng() < 0.6) {
      const branchSegs = 3 + Math.floor(rng() * 4);
      const branchAngle = baseAngle + (rng() < 0.5 ? -1 : 1) * (0.6 + rng() * 0.6);
      const offset = stepLen * (1 + Math.floor(rng() * 3));
      const bx = startX + Math.cos(baseAngle) * offset;
      const by = startY + Math.sin(baseAngle) * offset;
      drawCrack(ctx, W, H, bx, by, branchSegs, stepLen * 0.7, branchAngle, lineWidth * 0.6, spec.crackColor, rng);
    }
  }

  // Subtle highlight on a fraction of the cracks — looks like cement dust
  // or chipping along the crack edge, gives the cracks more dimension.
  for (let i = 0; i < spec.crackCount / 2; i++) {
    const startX = rng() * W;
    const startY = rng() * H;
    const segments = 3 + Math.floor(rng() * 4);
    const stepLen = 8 + rng() * 12;
    const baseAngle = rng() * Math.PI * 2;
    drawCrack(
      ctx,
      W,
      H,
      startX,
      startY + 1,
      segments,
      stepLen,
      baseAngle,
      0.5,
      spec.highlightColor,
      rng,
      0.35
    );
  }

  return canvas;
}

function drawCrack(
  ctx: CanvasRenderingContext2D,
  tileW: number,
  tileH: number,
  startX: number,
  startY: number,
  segments: number,
  stepLen: number,
  baseAngle: number,
  lineWidth: number,
  color: string,
  rng: () => number,
  alpha = 1
): void {
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
  let x = startX;
  let y = startY;
  let angle = baseAngle;
  for (let s = 0; s < segments; s++) {
    angle += (rng() - 0.5) * 0.9;
    x += Math.cos(angle) * stepLen;
    y += Math.sin(angle) * stepLen;
    points.push({ x, y });
  }

  ctx.strokeStyle = alpha < 1 ? withRgbaAlpha(color, alpha) : color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  // Draw the polyline at the original position and at all 8 wrap offsets so
  // any segment crossing the tile edge appears on the opposite edge too.
  const offsets: [number, number][] = [
    [0, 0],
    [tileW, 0],
    [-tileW, 0],
    [0, tileH],
    [0, -tileH],
    [tileW, tileH],
    [tileW, -tileH],
    [-tileW, tileH],
    [-tileW, -tileH],
  ];
  for (const [ox, oy] of offsets) {
    ctx.beginPath();
    ctx.moveTo(points[0].x + ox, points[0].y + oy);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x + ox, points[i].y + oy);
    }
    ctx.stroke();
  }
}

function drawWrapped(
  tileW: number,
  tileH: number,
  x: number,
  y: number,
  draw: (xx: number, yy: number) => void
): void {
  // Three offsets per axis is enough for the bake-time wrap (any feature
  // overflowing the tile reappears on the opposite edge).
  const offsets: [number, number][] = [
    [0, 0],
    [tileW, 0],
    [-tileW, 0],
    [0, tileH],
    [0, -tileH],
  ];
  for (const [ox, oy] of offsets) {
    draw(x + ox, y + oy);
  }
}

function withRgbaAlpha(color: string, alpha: number): string {
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

const FACING_THICKNESS = 18;

/**
 * Fills the canvas area outside the world rect with the solid cracked-stone
 * tile. No shear, no perspective — the area outside the play rect reads as
 * physical rock that the tunnel was hollowed out of.
 */
export function renderBeyondBorder(
  ctx: CanvasRenderingContext2D,
  worldRect: WorldRectOnScreen,
  viewport: CanvasViewport
): void {
  const tile = getStoneTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;

  ctx.save();

  // Even-odd clip = (full canvas) XOR (world rect) = the outside ring.
  // When the world rect already covers the canvas, the ring is empty and
  // subsequent fills are no-ops.
  ctx.beginPath();
  ctx.rect(0, 0, viewport.width, viewport.height);
  ctx.rect(
    worldRect.left,
    worldRect.top,
    worldRect.right - worldRect.left,
    worldRect.bottom - worldRect.top
  );
  ctx.clip('evenodd');

  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  ctx.restore();
}

/**
 * Draws a chunky textured "facing" strip along each visible world rect edge.
 * Reads as the inner face of the masonry — the visible wall the tunnel
 * boundary sits against. Sits on top of everything else.
 */
export function renderMapBorderFrame(
  ctx: CanvasRenderingContext2D,
  worldRect: WorldRectOnScreen,
  viewport: CanvasViewport
): void {
  const visible = {
    top: worldRect.top >= 0 && worldRect.top <= viewport.height,
    bottom: worldRect.bottom >= 0 && worldRect.bottom <= viewport.height,
    left: worldRect.left >= 0 && worldRect.left <= viewport.width,
    right: worldRect.right >= 0 && worldRect.right <= viewport.width,
  };

  if (!visible.top && !visible.bottom && !visible.left && !visible.right) return;

  const tile = getFacingTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;

  // Each facing strip sits OUTSIDE the world rect (in beyond-border space)
  // hugging the world edge. Thickness is uniform.
  const t = FACING_THICKNESS;

  ctx.save();
  ctx.fillStyle = pattern;

  if (visible.top) {
    ctx.fillRect(
      Math.max(0, worldRect.left - t),
      worldRect.top - t,
      Math.min(viewport.width, worldRect.right + t) - Math.max(0, worldRect.left - t),
      t
    );
  }
  if (visible.bottom) {
    ctx.fillRect(
      Math.max(0, worldRect.left - t),
      worldRect.bottom,
      Math.min(viewport.width, worldRect.right + t) - Math.max(0, worldRect.left - t),
      t
    );
  }
  if (visible.left) {
    ctx.fillRect(
      worldRect.left - t,
      Math.max(0, worldRect.top),
      t,
      Math.min(viewport.height, worldRect.bottom) - Math.max(0, worldRect.top)
    );
  }
  if (visible.right) {
    ctx.fillRect(
      worldRect.right,
      Math.max(0, worldRect.top),
      t,
      Math.min(viewport.height, worldRect.bottom) - Math.max(0, worldRect.top)
    );
  }
  ctx.restore();

  // Crisp dark line on the world rect edge for definition.
  ctx.save();
  ctx.strokeStyle = '#070605';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (visible.top) {
    ctx.moveTo(Math.max(0, worldRect.left - t), worldRect.top);
    ctx.lineTo(Math.min(viewport.width, worldRect.right + t), worldRect.top);
  }
  if (visible.bottom) {
    ctx.moveTo(Math.max(0, worldRect.left - t), worldRect.bottom);
    ctx.lineTo(Math.min(viewport.width, worldRect.right + t), worldRect.bottom);
  }
  if (visible.left) {
    ctx.moveTo(worldRect.left, Math.max(0, worldRect.top));
    ctx.lineTo(worldRect.left, Math.min(viewport.height, worldRect.bottom));
  }
  if (visible.right) {
    ctx.moveTo(worldRect.right, Math.max(0, worldRect.top));
    ctx.lineTo(worldRect.right, Math.min(viewport.height, worldRect.bottom));
  }
  ctx.stroke();
  ctx.restore();
}
