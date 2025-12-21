/**
 * Foreground vines layer - static decorative overlay.
 * Creates hanging vines with leaves from top of screen.
 */

import { createSeededRandom, type ParallaxLayerConfig } from '../parallaxConfig';

/**
 * Render a foreground vine tile.
 */
export function renderVineTile(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  tileX: number,
  tileY: number
): void {
  const { tileWidth, tileHeight, colors, seed } = layer;
  const tileSeed = seed + tileX * 1000 + tileY;
  const random = createSeededRandom(tileSeed);

  ctx.clearRect(0, 0, tileWidth, tileHeight);

  // Draw hanging vines from top
  const vineCount = 2 + Math.floor(random() * 3);

  for (let i = 0; i < vineCount; i++) {
    const startX = random() * tileWidth;
    const vineLength = tileHeight * (0.3 + random() * 0.4);

    drawHangingVine(ctx, random, startX, 0, vineLength, colors);
  }

  // Draw some vines creeping from sides
  if (random() > 0.5) {
    drawSideVine(ctx, random, 0, random() * tileHeight * 0.5, tileWidth * 0.3, colors, 1);
  }
  if (random() > 0.5) {
    drawSideVine(ctx, random, tileWidth, random() * tileHeight * 0.5, tileWidth * 0.3, colors, -1);
  }

  // Corner vine clusters
  if (tileX % 3 === 0 && tileY % 2 === 0) {
    drawVineCluster(ctx, random, 0, 0, colors);
  }
  if (tileX % 3 === 1 && tileY % 2 === 1) {
    drawVineCluster(ctx, random, tileWidth, 0, colors);
  }
}

/**
 * Draw a hanging vine with leaves.
 */
function drawHangingVine(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  startX: number,
  startY: number,
  length: number,
  colors: ParallaxLayerConfig['colors']
): void {
  // Generate vine path using bezier curves
  const segments = 4 + Math.floor(random() * 3);
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];

  let currentX = startX;
  let currentY = startY;

  for (let i = 0; i < segments; i++) {
    const segmentLength = length / segments;
    const sway = (random() - 0.5) * 40;
    currentX += sway;
    currentY += segmentLength;
    points.push({ x: currentX, y: currentY });
  }

  // Draw the vine stem
  ctx.strokeStyle = colors.shadow;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();

  // Draw leaves along the vine
  ctx.fillStyle = colors.primary;

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const leafCount = 1 + Math.floor(random() * 2);

    for (let l = 0; l < leafCount; l++) {
      const side = random() > 0.5 ? 1 : -1;
      const leafAngle = side * (Math.PI / 4 + random() * Math.PI / 4);
      drawLeaf(ctx, point.x, point.y, leafAngle, 8 + random() * 8, colors);
    }
  }

  // Tendril at the end
  drawTendril(ctx, last.x, last.y, colors.secondary);
}

/**
 * Draw a vine creeping from the side.
 */
function drawSideVine(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  startX: number,
  startY: number,
  length: number,
  colors: ParallaxLayerConfig['colors'],
  direction: number
): void {
  ctx.strokeStyle = colors.shadow;
  ctx.lineWidth = 2;

  const endX = startX + direction * length;
  const controlY = startY + (random() - 0.5) * 50;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(startX + direction * length * 0.5, controlY, endX, startY + random() * 30);
  ctx.stroke();

  // Add leaves
  ctx.fillStyle = colors.primary;
  const leafCount = 3 + Math.floor(random() * 3);
  for (let i = 0; i < leafCount; i++) {
    const t = (i + 1) / (leafCount + 1);
    const x = startX + direction * length * t;
    const y = startY + (controlY - startY) * Math.sin(t * Math.PI);
    drawLeaf(ctx, x, y, direction * (Math.PI / 3), 6 + random() * 6, colors);
  }
}

/**
 * Draw a decorative leaf.
 */
function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number,
  colors: ParallaxLayerConfig['colors']
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Leaf shape
  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.5, -size * 0.3, size, 0);
  ctx.quadraticCurveTo(size * 0.5, size * 0.3, 0, 0);
  ctx.fill();

  // Leaf vein
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.8, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a curly tendril.
 */
function drawTendril(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x, y);

  // Spiral down
  const spiralRadius = 8;
  const spiralLength = 20;
  for (let i = 0; i < spiralLength; i++) {
    const t = i / spiralLength;
    const angle = t * Math.PI * 3;
    const r = spiralRadius * (1 - t * 0.5);
    ctx.lineTo(x + Math.cos(angle) * r, y + i * 1.5);
  }

  ctx.stroke();
}

/**
 * Draw a dense vine cluster for corners.
 */
function drawVineCluster(
  ctx: CanvasRenderingContext2D,
  random: () => number,
  x: number,
  y: number,
  colors: ParallaxLayerConfig['colors']
): void {
  const clusterSize = 80 + random() * 40;

  // Multiple overlapping leaf clusters
  ctx.fillStyle = colors.shadow;
  for (let i = 0; i < 5; i++) {
    const blobX = x + (random() - 0.3) * clusterSize;
    const blobY = y + (random() - 0.3) * clusterSize;
    const radius = 15 + random() * 20;

    ctx.beginPath();
    ctx.arc(blobX, blobY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = colors.primary;
  for (let i = 0; i < 6; i++) {
    const blobX = x + (random() - 0.4) * clusterSize * 0.8;
    const blobY = y + (random() - 0.4) * clusterSize * 0.8;
    const radius = 12 + random() * 18;

    ctx.beginPath();
    ctx.arc(blobX, blobY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Accent leaves
  ctx.fillStyle = colors.accent;
  for (let i = 0; i < 3; i++) {
    const leafX = x + (random() - 0.5) * clusterSize * 0.5;
    const leafY = y + (random() - 0.5) * clusterSize * 0.5;
    drawLeaf(ctx, leafX, leafY, random() * Math.PI * 2, 10 + random() * 8, colors);
  }
}


