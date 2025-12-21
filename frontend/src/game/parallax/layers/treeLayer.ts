/**
 * Tree layers - procedural tree silhouettes at two depth levels.
 * Far trees are simpler silhouettes, near trees have more detail.
 */

import { createSeededRandom, type ParallaxLayerConfig } from '../parallaxConfig';

/**
 * Render a far tree tile (simpler, darker silhouettes).
 */
export function renderFarTreeTile(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  tileX: number,
  tileY: number
): void {
  const { tileWidth, tileHeight, colors, seed } = layer;
  const tileSeed = seed + tileX * 1000 + tileY;
  const random = createSeededRandom(tileSeed);

  ctx.clearRect(0, 0, tileWidth, tileHeight);

  // Draw tree silhouettes
  const treeCount = 4 + Math.floor(random() * 4);
  const groundY = tileHeight * 0.85;

  for (let i = 0; i < treeCount; i++) {
    const x = (i / treeCount) * tileWidth + random() * (tileWidth / treeCount) * 0.6;
    const height = tileHeight * (0.3 + random() * 0.35);
    const width = 40 + random() * 30;

    drawTreeSilhouette(ctx, random, x, groundY, width, height, colors.shadow, colors.primary);
  }

  // Ground moss line
  drawGroundMoss(ctx, random, tileWidth, groundY, tileHeight - groundY, colors.secondary);
}

/**
 * Render a near tree tile (more detail and richer colors).
 */
export function renderNearTreeTile(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  tileX: number,
  tileY: number
): void {
  const { tileWidth, tileHeight, colors, seed } = layer;
  const tileSeed = seed + tileX * 1000 + tileY;
  const random = createSeededRandom(tileSeed);

  ctx.clearRect(0, 0, tileWidth, tileHeight);

  // Draw more detailed trees
  const treeCount = 3 + Math.floor(random() * 3);
  const groundY = tileHeight * 0.88;

  for (let i = 0; i < treeCount; i++) {
    const x = (i / treeCount) * tileWidth + random() * (tileWidth / treeCount) * 0.5;
    const height = tileHeight * (0.4 + random() * 0.35);
    const width = 50 + random() * 40;

    // Draw trunk first
    drawTrunk(ctx, x, groundY, height * 0.4, width * 0.15, colors.accent);

    // Draw foliage with multiple layers
    drawDetailedFoliage(ctx, random, x, groundY - height * 0.3, width, height * 0.7, colors);
  }

  // Ground vegetation
  drawGroundMoss(ctx, random, tileWidth, groundY, tileHeight - groundY, colors.secondary);
}

/**
 * Draw a simple tree silhouette.
 */
function drawTreeSilhouette(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  x: number,
  groundY: number,
  width: number,
  height: number,
  trunkColor: string,
  foliageColor: string
): void {
  // Simple trunk
  const trunkWidth = width * 0.12;
  const trunkHeight = height * 0.3;
  ctx.fillStyle = trunkColor;
  ctx.fillRect(x - trunkWidth / 2, groundY - trunkHeight, trunkWidth, trunkHeight);

  // Triangular foliage silhouette
  ctx.fillStyle = foliageColor;
  ctx.beginPath();

  const foliageY = groundY - trunkHeight;
  const foliageHeight = height * 0.75;

  // Create layered triangular shape
  const layers = 3;
  for (let l = 0; l < layers; l++) {
    const layerY = foliageY - l * (foliageHeight / layers) * 0.7;
    const layerWidth = width * (1 - l * 0.2);
    const layerHeight = foliageHeight / layers + 10;

    ctx.moveTo(x, layerY - layerHeight);
    ctx.lineTo(x - layerWidth / 2, layerY);
    ctx.lineTo(x + layerWidth / 2, layerY);
    ctx.closePath();
  }

  ctx.fill();
}

/**
 * Draw a tree trunk.
 */
function drawTrunk(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  height: number,
  width: number,
  color: string
): void {
  ctx.fillStyle = color;

  // Trunk slightly wider at base
  ctx.beginPath();
  ctx.moveTo(x - width * 0.6, groundY);
  ctx.lineTo(x - width * 0.4, groundY - height);
  ctx.lineTo(x + width * 0.4, groundY - height);
  ctx.lineTo(x + width * 0.6, groundY);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw detailed foliage with multiple blob layers.
 */
function drawDetailedFoliage(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: ParallaxLayerConfig['colors']
): void {
  const blobCount = 5 + Math.floor(random() * 4);

  // Draw shadow blobs first
  ctx.fillStyle = colors.shadow;
  for (let i = 0; i < blobCount; i++) {
    const blobX = x + (random() - 0.5) * width * 0.8;
    const blobY = y - random() * height * 0.7;
    const blobRadius = 15 + random() * 25;

    ctx.beginPath();
    ctx.arc(blobX + 3, blobY + 3, blobRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main foliage blobs
  ctx.fillStyle = colors.primary;
  for (let i = 0; i < blobCount; i++) {
    const blobX = x + (random() - 0.5) * width * 0.7;
    const blobY = y - random() * height * 0.6;
    const blobRadius = 18 + random() * 28;

    ctx.beginPath();
    ctx.arc(blobX, blobY, blobRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Highlight blobs
  ctx.fillStyle = colors.secondary;
  for (let i = 0; i < Math.floor(blobCount / 2); i++) {
    const blobX = x + (random() - 0.5) * width * 0.5;
    const blobY = y - height * 0.2 - random() * height * 0.4;
    const blobRadius = 10 + random() * 15;

    ctx.beginPath();
    ctx.arc(blobX, blobY, blobRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw ground moss/vegetation strip.
 */
function drawGroundMoss(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  width: number,
  startY: number,
  height: number,
  color: string
): void {
  ctx.fillStyle = color;

  // Wavy ground line
  ctx.beginPath();
  ctx.moveTo(0, startY);

  const segments = 12;
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const waveY = startY + Math.sin(i * 0.8 + random()) * 8 - 5;
    ctx.lineTo(x, waveY);
  }

  ctx.lineTo(width, startY + height);
  ctx.lineTo(0, startY + height);
  ctx.closePath();
  ctx.fill();
}


