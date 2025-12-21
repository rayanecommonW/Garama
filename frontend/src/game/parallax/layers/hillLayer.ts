/**
 * Mossy hills layer - rolling organic hill silhouettes.
 * Creates smooth, undulating terrain with moss coverage.
 */

import { createSeededRandom, type ParallaxLayerConfig } from '../parallaxConfig';

/**
 * Render a mossy hill tile.
 */
export function renderHillTile(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  tileX: number,
  tileY: number
): void {
  const { tileWidth, tileHeight, colors, seed } = layer;
  const tileSeed = seed + tileX * 1000 + tileY;
  const random = createSeededRandom(tileSeed);

  // Transparent background - layers below will show through
  ctx.clearRect(0, 0, tileWidth, tileHeight);

  // Draw multiple hill layers from back to front
  const hillLayers = 3;

  for (let h = 0; h < hillLayers; h++) {
    const layerColor = h === 0 ? colors.shadow : h === 1 ? colors.primary : colors.secondary;
    const baseY = tileHeight * (0.5 + h * 0.12);
    const amplitude = tileHeight * (0.25 - h * 0.04);

    drawHillCurve(ctx, random, tileWidth, tileHeight, baseY, amplitude, layerColor);
  }

  // Add moss patches on top
  drawMossPatches(ctx, random, tileWidth, tileHeight, colors.accent);
}

/**
 * Draw a smooth hill curve using bezier curves.
 */
function drawHillCurve(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  width: number,
  height: number,
  baseY: number,
  amplitude: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, height);

  // Generate smooth hill points using sine-like curves with noise
  const points: { x: number; y: number }[] = [];
  const segments = 6;
  const segmentWidth = width / segments;

  for (let i = 0; i <= segments; i++) {
    const x = i * segmentWidth;
    // Combine multiple frequencies for organic look
    const noise1 = Math.sin((i / segments) * Math.PI * 2 + random() * Math.PI) * amplitude * 0.6;
    const noise2 = Math.sin((i / segments) * Math.PI * 4 + random() * Math.PI) * amplitude * 0.3;
    const noise3 = (random() - 0.5) * amplitude * 0.2;
    const y = baseY - noise1 - noise2 - noise3;
    points.push({ x, y });
  }

  // Draw smooth curve through points
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }

  // Connect to last point
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);

  // Close at bottom
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw scattered moss patches for texture.
 */
function drawMossPatches(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  width: number,
  height: number,
  color: string
): void {
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = color;

  const patchCount = 8 + Math.floor(random() * 8);

  for (let i = 0; i < patchCount; i++) {
    const x = random() * width;
    const y = height * 0.4 + random() * height * 0.5; // Mostly in lower portion
    const radiusX = 10 + random() * 30;
    const radiusY = 5 + random() * 15;

    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}


