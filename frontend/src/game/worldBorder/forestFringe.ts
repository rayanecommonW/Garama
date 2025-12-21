/**
 * Forest fringe renderer - dense vegetation at the world border edge.
 * Creates the illusion of the playable area surrounded by deep forest.
 */

import { createSeededRandom } from '../parallax/parallaxConfig';

export type ForestFringeColors = {
  treeDark: string;
  treeMid: string;
  treeLight: string;
  bushDark: string;
  bushLight: string;
  moss: string;
};

export const FOREST_FRINGE_COLORS: ForestFringeColors = {
  treeDark: '#0d1f0d',
  treeMid: '#1a3d1a',
  treeLight: '#2d5a2d',
  bushDark: '#1a2e1a',
  bushLight: '#2d4a2d',
  moss: '#3d5c3d',
};

/**
 * Draw forest fringe along a border edge.
 */
export function drawForestFringe(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  length: number,
  depth: number,
  direction: 'horizontal' | 'vertical',
  outward: 'left' | 'right' | 'up' | 'down',
  seed: number
): void {
  const random = createSeededRandom(seed);

  // Draw multiple layers from back to front
  // Layer 1: Dense dark silhouettes (furthest)
  drawTreeSilhouetteLayer(ctx, startX, startY, length, depth, direction, outward, random, 0.8, FOREST_FRINGE_COLORS.treeDark);

  // Layer 2: Mid-depth trees
  drawTreeSilhouetteLayer(ctx, startX, startY, length, depth, direction, outward, random, 0.5, FOREST_FRINGE_COLORS.treeMid);

  // Layer 3: Foreground bushes and trees
  drawBushLayer(ctx, startX, startY, length, depth, direction, outward, random, 0.2, FOREST_FRINGE_COLORS.bushDark);

  // Layer 4: Moss and ground cover at edge
  drawMossEdge(ctx, startX, startY, length, direction, outward, random);
}

/**
 * Draw a layer of tree silhouettes.
 */
function drawTreeSilhouetteLayer(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  length: number,
  depth: number,
  direction: 'horizontal' | 'vertical',
  outward: 'left' | 'right' | 'up' | 'down',
  random: () => number,
  depthFactor: number,
  color: string
): void {
  const treeCount = Math.ceil(length / 60);
  const layerDepth = depth * depthFactor;

  ctx.fillStyle = color;

  for (let i = 0; i < treeCount; i++) {
    const treeRandom = createSeededRandom(Math.floor(random() * 100000));
    const progress = (i + treeRandom()) / treeCount;

    let treeX: number, treeY: number;
    const treeHeight = 60 + treeRandom() * 80;
    const treeWidth = 30 + treeRandom() * 40;

    if (direction === 'horizontal') {
      treeX = startX + progress * length;
      const baseOffset = layerDepth + treeRandom() * depth * 0.2;
      treeY = outward === 'up' ? startY - baseOffset : startY + baseOffset;
    } else {
      treeY = startY + progress * length;
      const baseOffset = layerDepth + treeRandom() * depth * 0.2;
      treeX = outward === 'left' ? startX - baseOffset : startX + baseOffset;
    }

    drawTreeSilhouette(ctx, treeX, treeY, treeWidth, treeHeight, direction, outward, treeRandom);
  }
}

/**
 * Draw a single tree silhouette.
 */
function drawTreeSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  direction: 'horizontal' | 'vertical',
  outward: 'left' | 'right' | 'up' | 'down',
  random: () => number
): void {
  ctx.beginPath();

  if (direction === 'horizontal') {
    // Tree growing perpendicular to horizontal border
    const growDir = outward === 'up' ? -1 : 1;

    // Trunk
    ctx.moveTo(x - width * 0.1, y);
    ctx.lineTo(x + width * 0.1, y);

    // Foliage - layered triangles
    const layers = 3;
    for (let l = 0; l < layers; l++) {
      const layerY = y + growDir * (height * 0.2 + (l * height * 0.25));
      const layerWidth = width * (1 - l * 0.15);
      const layerHeight = height * 0.35;

      ctx.lineTo(x + layerWidth / 2, layerY);
      ctx.lineTo(x, layerY + growDir * layerHeight);
      ctx.lineTo(x - layerWidth / 2, layerY);
    }
  } else {
    // Tree growing perpendicular to vertical border
    const growDir = outward === 'left' ? -1 : 1;

    // Trunk
    ctx.moveTo(x, y - width * 0.1);
    ctx.lineTo(x, y + width * 0.1);

    // Foliage
    const layers = 3;
    for (let l = 0; l < layers; l++) {
      const layerX = x + growDir * (height * 0.2 + (l * height * 0.25));
      const layerWidth = width * (1 - l * 0.15);
      const layerHeight = height * 0.35;

      ctx.lineTo(layerX, y + layerWidth / 2);
      ctx.lineTo(layerX + growDir * layerHeight, y);
      ctx.lineTo(layerX, y - layerWidth / 2);
    }
  }

  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a layer of bushes and shrubs.
 */
function drawBushLayer(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  length: number,
  depth: number,
  direction: 'horizontal' | 'vertical',
  outward: 'left' | 'right' | 'up' | 'down',
  random: () => number,
  depthFactor: number,
  color: string
): void {
  const bushCount = Math.ceil(length / 35);
  const layerDepth = depth * depthFactor;

  ctx.fillStyle = color;

  for (let i = 0; i < bushCount; i++) {
    const progress = (i + random() * 0.5) / bushCount;
    const bushWidth = 20 + random() * 30;
    const bushHeight = 15 + random() * 20;

    let bushX: number, bushY: number;

    if (direction === 'horizontal') {
      bushX = startX + progress * length;
      const baseOffset = layerDepth + random() * depth * 0.15;
      bushY = outward === 'up' ? startY - baseOffset : startY + baseOffset;
    } else {
      bushY = startY + progress * length;
      const baseOffset = layerDepth + random() * depth * 0.15;
      bushX = outward === 'left' ? startX - baseOffset : startX + baseOffset;
    }

    // Bush as overlapping circles
    const blobCount = 3 + Math.floor(random() * 3);
    for (let b = 0; b < blobCount; b++) {
      const blobX = bushX + (random() - 0.5) * bushWidth;
      const blobY = bushY + (random() - 0.5) * bushHeight * 0.5;
      const radius = 8 + random() * 12;

      ctx.beginPath();
      ctx.arc(blobX, blobY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Add highlight bushes
  ctx.fillStyle = FOREST_FRINGE_COLORS.bushLight;
  for (let i = 0; i < bushCount / 2; i++) {
    const progress = (i * 2 + random()) / bushCount;

    let x: number, y: number;
    if (direction === 'horizontal') {
      x = startX + progress * length;
      y = outward === 'up' ? startY - layerDepth * 0.8 : startY + layerDepth * 0.8;
    } else {
      y = startY + progress * length;
      x = outward === 'left' ? startX - layerDepth * 0.8 : startX + layerDepth * 0.8;
    }

    const radius = 5 + random() * 8;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw moss and ground cover at the very edge.
 */
function drawMossEdge(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  length: number,
  direction: 'horizontal' | 'vertical',
  outward: 'left' | 'right' | 'up' | 'down',
  random: () => number
): void {
  ctx.fillStyle = FOREST_FRINGE_COLORS.moss;

  const mossCount = Math.ceil(length / 20);

  for (let i = 0; i < mossCount; i++) {
    const progress = i / mossCount + random() * (1 / mossCount);

    let x: number, y: number;
    if (direction === 'horizontal') {
      x = startX + progress * length;
      y = startY;
    } else {
      y = startY + progress * length;
      x = startX;
    }

    // Small moss patches right at the edge
    const patchWidth = 10 + random() * 15;
    const patchHeight = 5 + random() * 8;

    ctx.beginPath();
    if (direction === 'horizontal') {
      const offsetY = outward === 'up' ? -patchHeight / 2 : patchHeight / 2;
      ctx.ellipse(x, y + offsetY, patchWidth / 2, patchHeight / 2, 0, 0, Math.PI * 2);
    } else {
      const offsetX = outward === 'left' ? -patchWidth / 2 : patchWidth / 2;
      ctx.ellipse(x + offsetX, y, patchHeight / 2, patchWidth / 2, 0, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}


