/**
 * Procedural veiny vine texture for the world border edge.
 * Creates organic, branching vine patterns.
 */

import { createSeededRandom } from '../parallax/parallaxConfig';

export type VineTextureColors = {
  stem: string;
  leaf: string;
  leafHighlight: string;
  vein: string;
};

export const VINE_BORDER_COLORS: VineTextureColors = {
  stem: '#1a3d1a',
  leaf: '#2d5a2d',
  leafHighlight: '#3d6b3d',
  vein: '#4a7d4a',
};

/**
 * Draw veiny vine texture along a border edge.
 */
export function drawVineBorderTexture(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  length: number,
  thickness: number,
  direction: 'horizontal' | 'vertical',
  inward: 'left' | 'right' | 'up' | 'down',
  seed: number
): void {
  const random = createSeededRandom(seed);

  // Main vine stems running along the border
  const stemCount = Math.ceil(length / 150);

  for (let i = 0; i < stemCount; i++) {
    const stemSeed = seed + i * 1000;
    const stemRandom = createSeededRandom(stemSeed);

    if (direction === 'horizontal') {
      const x = startX + (i / stemCount) * length + stemRandom() * (length / stemCount);
      drawBorderVineCluster(ctx, x, startY, thickness, inward, stemRandom);
    } else {
      const y = startY + (i / stemCount) * length + stemRandom() * (length / stemCount);
      drawBorderVineCluster(ctx, startX, y, thickness, inward, stemRandom);
    }
  }

  // Connect with main runner vine
  drawRunnerVine(ctx, startX, startY, length, thickness, direction, inward, random);
}

/**
 * Draw a cluster of vines emanating from a point on the border.
 */
function drawBorderVineCluster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  thickness: number,
  inward: 'left' | 'right' | 'up' | 'down',
  random: () => number
): void {
  const vineCount = 2 + Math.floor(random() * 3);

  for (let v = 0; v < vineCount; v++) {
    const vineLength = thickness * (0.4 + random() * 0.5);
    const spread = (random() - 0.5) * Math.PI * 0.5;

    let baseAngle: number;
    switch (inward) {
      case 'right':
        baseAngle = 0;
        break;
      case 'left':
        baseAngle = Math.PI;
        break;
      case 'down':
        baseAngle = Math.PI / 2;
        break;
      case 'up':
        baseAngle = -Math.PI / 2;
        break;
    }

    const angle = baseAngle + spread;
    drawSingleVine(ctx, x, y, angle, vineLength, random);
  }
}

/**
 * Draw a single vine tendril with leaves.
 */
function drawSingleVine(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  angle: number,
  length: number,
  random: () => number
): void {
  const segments = 4 + Math.floor(random() * 3);
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];

  let currentX = startX;
  let currentY = startY;
  let currentAngle = angle;

  for (let i = 0; i < segments; i++) {
    const segmentLength = length / segments;
    currentAngle += (random() - 0.5) * 0.4;
    currentX += Math.cos(currentAngle) * segmentLength;
    currentY += Math.sin(currentAngle) * segmentLength;
    points.push({ x: currentX, y: currentY });
  }

  // Draw stem
  ctx.strokeStyle = VINE_BORDER_COLORS.stem;
  ctx.lineWidth = 3 + random() * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }

  ctx.stroke();

  // Draw leaves at nodes
  for (let i = 1; i < points.length; i++) {
    if (random() > 0.3) {
      const point = points[i];
      const prevPoint = points[i - 1];
      const leafAngle = Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x);

      // Leaves on alternating sides
      const side = i % 2 === 0 ? 1 : -1;
      drawBorderLeaf(ctx, point.x, point.y, leafAngle + (side * Math.PI) / 3, 10 + random() * 10);
    }
  }

  // Tendril at end
  if (random() > 0.5) {
    const last = points[points.length - 1];
    drawTendril(ctx, last.x, last.y, angle);
  }
}

/**
 * Draw a leaf for the border vines.
 */
function drawBorderLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Leaf shadow
  ctx.fillStyle = VINE_BORDER_COLORS.stem;
  ctx.beginPath();
  ctx.moveTo(2, 2);
  ctx.quadraticCurveTo(size * 0.6 + 2, -size * 0.35 + 2, size + 2, 2);
  ctx.quadraticCurveTo(size * 0.6 + 2, size * 0.35 + 2, 2, 2);
  ctx.fill();

  // Main leaf
  ctx.fillStyle = VINE_BORDER_COLORS.leaf;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.6, -size * 0.35, size, 0);
  ctx.quadraticCurveTo(size * 0.6, size * 0.35, 0, 0);
  ctx.fill();

  // Leaf highlight
  ctx.fillStyle = VINE_BORDER_COLORS.leafHighlight;
  ctx.beginPath();
  ctx.moveTo(size * 0.2, 0);
  ctx.quadraticCurveTo(size * 0.5, -size * 0.15, size * 0.7, 0);
  ctx.quadraticCurveTo(size * 0.5, size * 0.1, size * 0.2, 0);
  ctx.fill();

  // Vein
  ctx.strokeStyle = VINE_BORDER_COLORS.vein;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.85, 0);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw a curling tendril.
 */
function drawTendril(ctx: CanvasRenderingContext2D, x: number, y: number, baseAngle: number): void {
  ctx.strokeStyle = VINE_BORDER_COLORS.vein;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x, y);

  const spiralLength = 15;
  for (let i = 0; i < spiralLength; i++) {
    const t = i / spiralLength;
    const spiralAngle = baseAngle + t * Math.PI * 2.5;
    const radius = 6 * (1 - t * 0.7);
    const px = x + Math.cos(spiralAngle) * radius + Math.cos(baseAngle) * i * 0.8;
    const py = y + Math.sin(spiralAngle) * radius + Math.sin(baseAngle) * i * 0.8;
    ctx.lineTo(px, py);
  }

  ctx.stroke();
}

/**
 * Draw the main runner vine along the border.
 */
function drawRunnerVine(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  length: number,
  thickness: number,
  direction: 'horizontal' | 'vertical',
  inward: 'left' | 'right' | 'up' | 'down',
  random: () => number
): void {
  ctx.strokeStyle = VINE_BORDER_COLORS.stem;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  ctx.beginPath();

  if (direction === 'horizontal') {
    ctx.moveTo(startX, startY);

    const segments = Math.ceil(length / 50);
    for (let i = 1; i <= segments; i++) {
      const x = startX + (i / segments) * length;
      const waveOffset = Math.sin(i * 0.7 + random()) * 8;
      const y = startY + (inward === 'down' ? 1 : -1) * (5 + waveOffset);
      ctx.lineTo(x, y);
    }
  } else {
    ctx.moveTo(startX, startY);

    const segments = Math.ceil(length / 50);
    for (let i = 1; i <= segments; i++) {
      const y = startY + (i / segments) * length;
      const waveOffset = Math.sin(i * 0.7 + random()) * 8;
      const x = startX + (inward === 'right' ? 1 : -1) * (5 + waveOffset);
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}


