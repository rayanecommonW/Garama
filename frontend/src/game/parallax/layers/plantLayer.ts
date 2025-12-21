/**
 * Plants and shrubs layer - ground-level vegetation.
 * Features ferns, small bushes, and moss clusters.
 */

import { createSeededRandom, type ParallaxLayerConfig } from '../parallaxConfig';

/**
 * Render a plant/shrub tile.
 */
export function renderPlantTile(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  tileX: number,
  tileY: number
): void {
  const { tileWidth, tileHeight, colors, seed } = layer;
  const tileSeed = seed + tileX * 1000 + tileY;
  const random = createSeededRandom(tileSeed);

  ctx.clearRect(0, 0, tileWidth, tileHeight);

  const groundY = tileHeight * 0.75;

  // Draw various plant types
  const plantCount = 6 + Math.floor(random() * 6);

  for (let i = 0; i < plantCount; i++) {
    const x = random() * tileWidth;
    const plantType = random();

    if (plantType < 0.4) {
      drawFern(ctx, random, x, groundY, colors);
    } else if (plantType < 0.7) {
      drawBush(ctx, random, x, groundY, colors);
    } else {
      drawMossCluster(ctx, random, x, groundY, colors);
    }
  }

  // Add some grass tufts
  drawGrassTufts(ctx, random, tileWidth, groundY, colors);
}

/**
 * Draw a fern plant with fronds.
 */
function drawFern(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  x: number,
  groundY: number,
  colors: ParallaxLayerConfig['colors']
): void {
  const frondCount = 3 + Math.floor(random() * 4);
  const baseHeight = 30 + random() * 40;

  for (let f = 0; f < frondCount; f++) {
    const angle = ((f / frondCount) * Math.PI - Math.PI / 2) * 0.6 + (random() - 0.5) * 0.3;
    const length = baseHeight * (0.7 + random() * 0.3);

    drawFrond(ctx, x, groundY, angle, length, colors);
  }
}

/**
 * Draw a single fern frond.
 */
function drawFrond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  colors: ParallaxLayerConfig['colors']
): void {
  ctx.strokeStyle = colors.shadow;
  ctx.lineWidth = 2;

  // Main stem
  const endX = x + Math.sin(angle) * length;
  const endY = y - Math.cos(angle) * length;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + Math.sin(angle) * length * 0.5, y - Math.cos(angle) * length * 0.6, endX, endY);
  ctx.stroke();

  // Leaflets along the frond
  ctx.fillStyle = colors.primary;
  const leafletCount = 6;

  for (let i = 1; i <= leafletCount; i++) {
    const t = i / leafletCount;
    const leafX = x + Math.sin(angle) * length * t;
    const leafY = y - Math.cos(angle) * length * t;
    const leafSize = 4 + (1 - t) * 8;

    // Left leaflet
    ctx.beginPath();
    ctx.ellipse(
      leafX - Math.cos(angle) * leafSize,
      leafY - Math.sin(angle) * leafSize * 0.5,
      leafSize,
      leafSize * 0.4,
      angle - Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Right leaflet
    ctx.beginPath();
    ctx.ellipse(
      leafX + Math.cos(angle) * leafSize,
      leafY + Math.sin(angle) * leafSize * 0.5,
      leafSize,
      leafSize * 0.4,
      angle + Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

/**
 * Draw a small bush.
 */
function drawBush(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  x: number,
  groundY: number,
  colors: ParallaxLayerConfig['colors']
): void {
  const width = 25 + random() * 30;
  const height = 15 + random() * 20;
  const blobCount = 4 + Math.floor(random() * 3);

  // Shadow layer
  ctx.fillStyle = colors.shadow;
  for (let i = 0; i < blobCount; i++) {
    const blobX = x + (random() - 0.5) * width;
    const blobY = groundY - random() * height * 0.5;
    const radius = 8 + random() * 10;

    ctx.beginPath();
    ctx.arc(blobX + 2, blobY + 2, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main bush blobs
  ctx.fillStyle = colors.primary;
  for (let i = 0; i < blobCount; i++) {
    const blobX = x + (random() - 0.5) * width;
    const blobY = groundY - 5 - random() * height * 0.6;
    const radius = 10 + random() * 12;

    ctx.beginPath();
    ctx.arc(blobX, blobY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Highlight spots
  ctx.fillStyle = colors.secondary;
  for (let i = 0; i < 2; i++) {
    const blobX = x + (random() - 0.5) * width * 0.5;
    const blobY = groundY - height * 0.3 - random() * height * 0.3;
    const radius = 5 + random() * 6;

    ctx.beginPath();
    ctx.arc(blobX, blobY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw a moss cluster.
 */
function drawMossCluster(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  x: number,
  groundY: number,
  colors: ParallaxLayerConfig['colors']
): void {
  const width = 20 + random() * 25;
  const height = 8 + random() * 10;

  // Base moss mound
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.ellipse(x, groundY - height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Texture dots
  ctx.fillStyle = colors.accent;
  const dotCount = 5 + Math.floor(random() * 5);
  for (let i = 0; i < dotCount; i++) {
    const dotX = x + (random() - 0.5) * width * 0.7;
    const dotY = groundY - height / 2 + (random() - 0.5) * height * 0.5;
    const radius = 1 + random() * 2;

    ctx.beginPath();
    ctx.arc(dotX, dotY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw grass tufts along the ground.
 */
function drawGrassTufts(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  width: number,
  groundY: number,
  colors: ParallaxLayerConfig['colors']
): void {
  const tuftCount = 10 + Math.floor(random() * 10);

  for (let i = 0; i < tuftCount; i++) {
    const x = random() * width;
    const bladeCount = 3 + Math.floor(random() * 4);

    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 1.5;

    for (let b = 0; b < bladeCount; b++) {
      const bladeHeight = 8 + random() * 15;
      const curvature = (random() - 0.5) * 15;

      ctx.beginPath();
      ctx.moveTo(x + b * 2 - bladeCount, groundY);
      ctx.quadraticCurveTo(x + b * 2 - bladeCount + curvature * 0.5, groundY - bladeHeight * 0.6, x + curvature, groundY - bladeHeight);
      ctx.stroke();
    }
  }
}


