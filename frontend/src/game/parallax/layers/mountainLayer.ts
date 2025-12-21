/**
 * Distant rock/moss layer - the furthest background layer.
 * Renders jagged rock formations with mossy textures.
 */

import { createSeededRandom, type ParallaxLayerConfig } from '../parallaxConfig';

/**
 * Render a mountain/rock tile for the distant background.
 */
export function renderMountainTile(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  tileX: number,
  tileY: number
): void {
  const { tileWidth, tileHeight, colors, seed } = layer;
  const tileSeed = seed + tileX * 1000 + tileY;
  const random = createSeededRandom(tileSeed);

  // Fill background with deep shadow
  ctx.fillStyle = colors.shadow;
  ctx.fillRect(0, 0, tileWidth, tileHeight);

  // Draw multiple mountain silhouettes at different heights
  const mountainCount = 3 + Math.floor(random() * 3);

  for (let m = 0; m < mountainCount; m++) {
    const mountainColor = m === 0 ? colors.primary : m === 1 ? colors.secondary : colors.accent;
    const baseY = tileHeight * (0.4 + m * 0.15);
    const heightVariation = tileHeight * (0.3 - m * 0.05);

    drawMountainSilhouette(ctx, random, tileWidth, baseY, heightVariation, mountainColor);
  }

  // Add subtle moss texture overlay
  drawMossTexture(ctx, random, tileWidth, tileHeight, colors.accent, 0.15);
}

/**
 * Draw a single mountain silhouette using jagged peaks.
 */
function drawMountainSilhouette(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  width: number,
  baseY: number,
  heightVariation: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, baseY + heightVariation);

  // Create jagged mountain peaks
  const segments = 8 + Math.floor(random() * 6);
  const segmentWidth = width / segments;

  for (let i = 0; i <= segments; i++) {
    const x = i * segmentWidth;
    const peakHeight = random() * heightVariation;
    const y = baseY - peakHeight;

    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      // Add some intermediate points for more natural look
      const midX = x - segmentWidth / 2;
      const midY = baseY - random() * heightVariation * 0.7;
      ctx.lineTo(midX, midY);
      ctx.lineTo(x, y);
    }
  }

  // Close the path at the bottom
  ctx.lineTo(width, baseY + heightVariation * 2);
  ctx.lineTo(0, baseY + heightVariation * 2);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw subtle moss texture using scattered dots.
 */
function drawMossTexture(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  width: number,
  height: number,
  color: string,
  opacity: number
): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  const dotCount = Math.floor((width * height) / 2000);

  for (let i = 0; i < dotCount; i++) {
    const x = random() * width;
    const y = random() * height;
    const radius = 1 + random() * 3;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}


