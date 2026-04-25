/**
 * Map border / "beyond the world" frame.
 *
 * Two responsibilities:
 *   1. Fill the canvas area OUTSIDE the world rect with a brick texture
 *      sheared via cavalier projection — gives the world rect a recessed,
 *      window-into-a-thick-wall feel instead of a black void.
 *   2. Draw a heavy textured frame on the world rect's visible edges so
 *      the boundary reads as masonry, not a one-pixel line.
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
/*  Brick tile cache                                                          */
/* -------------------------------------------------------------------------- */

let brickTile: HTMLCanvasElement | null = null;

function getBrickTile(): HTMLCanvasElement {
  if (brickTile) return brickTile;
  brickTile = bakeBrickTile();
  return brickTile;
}

/** Bake the small repeating brick tile used for both the beyond-border fill
 *  and the visible border frame. Smaller and darker than the parallax
 *  back wall on purpose — it's "the wall the tunnel was carved into",
 *  not the tunnel interior.
 */
function bakeBrickTile(): HTMLCanvasElement {
  const W = 256;
  const H = 192;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rng = mulberry32(0xb71c4a);
  const bw = 64;
  const bh = 24;

  // Mortar background.
  ctx.fillStyle = '#15100c';
  ctx.fillRect(0, 0, W, H);

  const rows = Math.ceil(H / bh) + 1;
  for (let row = 0; row < rows; row++) {
    const y = row * bh;
    const offsetX = (row % 2) * (bw / 2);
    for (let col = -1; col * bw - offsetX < W + bw; col++) {
      const x = col * bw - offsetX;

      const tone = 38 + Math.floor(rng() * 32);
      const r = Math.floor(tone * 1.35);
      const g = Math.floor(tone * 0.88);
      const b = Math.floor(tone * 0.65);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);

      // Top highlight + bottom shadow inside each brick.
      ctx.fillStyle = 'rgba(255, 230, 200, 0.06)';
      ctx.fillRect(x + 1, y + 1, bw - 2, 1);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(x + 1, y + bh - 2, bw - 2, 1);

      if (rng() < 0.25) {
        const sx = x + 2 + rng() * (bw - 8);
        const sy = y + 2 + rng() * (bh - 6);
        ctx.fillStyle = `rgba(${Math.max(0, r - 18)}, ${Math.max(0, g - 18)}, ${Math.max(0, b - 12)}, 0.5)`;
        ctx.fillRect(sx, sy, 2 + rng() * 4, 1 + rng() * 2);
      }
    }
  }

  return canvas;
}

/** Manual reset hook for tests / hot reload. */
export function clearMapBorderCache(): void {
  brickTile = null;
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                */
/* -------------------------------------------------------------------------- */

const SHEAR = 0.35;
const TINT_BASE = 0.55;
const VIGNETTE_OUTER = 0.45;

/**
 * Fills the canvas area outside the world rect with a cavalier-sheared brick
 * texture. Replaces the old solid `MAP_OUTSIDE_COLOR` fill. Safe to call when
 * the world rect fully covers the canvas — the clip-out becomes a no-op.
 */
export function renderBeyondBorder(
  ctx: CanvasRenderingContext2D,
  worldRect: WorldRectOnScreen,
  viewport: CanvasViewport
): void {
  const tile = getBrickTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;

  ctx.save();

  // Clip to (full canvas \ world rect) using even-odd. The two rects nested
  // produce an "outside ring" mask. When the world rect already covers the
  // canvas, the ring is empty and subsequent fills paint nothing.
  ctx.beginPath();
  ctx.rect(0, 0, viewport.width, viewport.height);
  ctx.rect(
    worldRect.left,
    worldRect.top,
    worldRect.right - worldRect.left,
    worldRect.bottom - worldRect.top
  );
  ctx.clip('evenodd');

  // Brick base, sheared (cavalier projection: rear of the wall shifts upper-right).
  ctx.save();
  ctx.transform(1, 0, -SHEAR, 1, 0, 0);
  ctx.fillStyle = pattern;
  const overshoot = SHEAR * viewport.height + 200;
  ctx.fillRect(-overshoot, -200, viewport.width + 2 * overshoot, viewport.height + 400);
  ctx.restore();

  // Flat tint to push the brick further back tonally — beyond-border isn't
  // the focus, the world rect is.
  ctx.fillStyle = `rgba(0, 0, 0, ${TINT_BASE})`;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  // Edge vignette: the canvas corners go darker than the area near the
  // world rect, so the eye reads "the tunnel is the lit space, the rest
  // is deeper into the masonry".
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  const vignette = ctx.createRadialGradient(
    cx,
    cy,
    Math.min(viewport.width, viewport.height) * 0.25,
    cx,
    cy,
    Math.max(viewport.width, viewport.height) * 0.7
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, `rgba(0, 0, 0, ${VIGNETTE_OUTER})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  ctx.restore();
}

/**
 * Draws a heavy textured frame on the world rect's visible edges. Sits on
 * top of everything else so the play area is clearly delimited.
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

  // Inner shadow strip just inside the world rect — gives the play area a
  // recessed, "we're looking through a hole in the masonry" feel.
  const insetVisible =
    worldRect.right > 0 &&
    worldRect.left < viewport.width &&
    worldRect.bottom > 0 &&
    worldRect.top < viewport.height;
  if (insetVisible) {
    const ix0 = Math.max(0, worldRect.left);
    const iy0 = Math.max(0, worldRect.top);
    const ix1 = Math.min(viewport.width, worldRect.right);
    const iy1 = Math.min(viewport.height, worldRect.bottom);

    ctx.save();
    ctx.beginPath();
    ctx.rect(ix0, iy0, ix1 - ix0, iy1 - iy0);
    ctx.clip();

    const shadowDepth = 14;
    if (visible.top) {
      const grad = ctx.createLinearGradient(0, worldRect.top, 0, worldRect.top + shadowDepth);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(ix0, worldRect.top, ix1 - ix0, shadowDepth);
    }
    if (visible.bottom) {
      const grad = ctx.createLinearGradient(0, worldRect.bottom - shadowDepth, 0, worldRect.bottom);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(ix0, worldRect.bottom - shadowDepth, ix1 - ix0, shadowDepth);
    }
    if (visible.left) {
      const grad = ctx.createLinearGradient(worldRect.left, 0, worldRect.left + shadowDepth, 0);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(worldRect.left, iy0, shadowDepth, iy1 - iy0);
    }
    if (visible.right) {
      const grad = ctx.createLinearGradient(worldRect.right - shadowDepth, 0, worldRect.right, 0);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(worldRect.right - shadowDepth, iy0, shadowDepth, iy1 - iy0);
    }
    ctx.restore();
  }

  // Crisp dark line on the world rect edge so the boundary doesn't
  // dissolve into the brick texture either side.
  ctx.save();
  ctx.strokeStyle = '#0a0706';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (visible.top) {
    ctx.moveTo(Math.max(0, worldRect.left), worldRect.top);
    ctx.lineTo(Math.min(viewport.width, worldRect.right), worldRect.top);
  }
  if (visible.bottom) {
    ctx.moveTo(Math.max(0, worldRect.left), worldRect.bottom);
    ctx.lineTo(Math.min(viewport.width, worldRect.right), worldRect.bottom);
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
