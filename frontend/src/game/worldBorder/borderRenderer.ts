/**
 * World border renderer - renders the textured border around the playable area.
 * Includes green texture zone, forest fringe, and veiny vine overlays.
 */

import { MAP_WIDTH, MAP_HEIGHT } from '@garama/shared';

import { drawForestFringe } from './forestFringe';
import { drawVineBorderTexture } from './vineTexture';

// Border configuration
const BORDER_DEPTH = 200; // How far the border extends beyond map bounds
const FOREST_FRINGE_DEPTH = 150; // Depth of the forest fringe layer
const VINE_THICKNESS = 80; // Thickness of the vine texture zone

// Border colors
const BORDER_COLORS = {
  outerDark: '#0a0f0a',
  greenZone: '#0d1f0d',
  greenGradientEnd: '#1a2e1a',
};

// Fixed seeds for deterministic border rendering (no movement)
const BORDER_SEEDS = {
  left: 10001,
  right: 20002,
  top: 30003,
  bottom: 40004,
};

/**
 * Render the world border with all its layers.
 * Should be called AFTER game world rendering (max z-index).
 */
export function renderWorldBorder(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  // Calculate camera bounds
  const cameraLeft = cameraX - viewportWidth / 2;
  const cameraTop = cameraY - viewportHeight / 2;

  // World bounds in screen coordinates (Y inverted)
  const worldScreenLeft = 0 - cameraLeft;
  const worldScreenRight = MAP_WIDTH - cameraLeft;
  const worldScreenTop = viewportHeight - (MAP_HEIGHT - cameraTop);
  const worldScreenBottom = viewportHeight - (0 - cameraTop);

  // Render the four border regions
  renderLeftBorder(ctx, worldScreenLeft, worldScreenTop, worldScreenBottom, viewportHeight);
  renderRightBorder(ctx, worldScreenRight, worldScreenTop, worldScreenBottom, viewportWidth, viewportHeight);
  renderTopBorder(ctx, worldScreenLeft, worldScreenRight, worldScreenTop, viewportWidth);
  renderBottomBorder(ctx, worldScreenLeft, worldScreenRight, worldScreenBottom, viewportWidth, viewportHeight);
}

/**
 * Render the left border region.
 */
function renderLeftBorder(
  ctx: CanvasRenderingContext2D,
  worldScreenLeft: number,
  worldScreenTop: number,
  worldScreenBottom: number,
  viewportHeight: number
): void {
  if (worldScreenLeft <= 0) return; // Border not visible

  const borderWidth = Math.min(worldScreenLeft, BORDER_DEPTH);
  const visibleTop = Math.max(0, worldScreenTop);
  const visibleBottom = Math.min(viewportHeight, worldScreenBottom);
  const visibleHeight = visibleBottom - visibleTop;

  if (visibleHeight <= 0) return;

  // Total border height in world space (full map height)
  const totalBorderHeight = worldScreenBottom - worldScreenTop;

  ctx.save();
  // Clip to visible region
  ctx.beginPath();
  ctx.rect(worldScreenLeft - borderWidth, visibleTop, borderWidth + FOREST_FRINGE_DEPTH, visibleHeight);
  ctx.clip();

  // Green gradient zone
  const gradient = ctx.createLinearGradient(worldScreenLeft - borderWidth, 0, worldScreenLeft, 0);
  gradient.addColorStop(0, BORDER_COLORS.outerDark);
  gradient.addColorStop(0.3, BORDER_COLORS.greenZone);
  gradient.addColorStop(1, BORDER_COLORS.greenGradientEnd);

  ctx.fillStyle = gradient;
  ctx.fillRect(worldScreenLeft - borderWidth, worldScreenTop, borderWidth, totalBorderHeight);

  // Forest fringe - use WORLD coordinates (worldScreenTop), not visible coordinates
  drawForestFringe(
    ctx,
    worldScreenLeft,
    worldScreenTop,
    totalBorderHeight,
    FOREST_FRINGE_DEPTH,
    'vertical',
    'left',
    BORDER_SEEDS.left
  );

  // Vine texture at the edge
  drawVineBorderTexture(
    ctx,
    worldScreenLeft,
    worldScreenTop,
    totalBorderHeight,
    VINE_THICKNESS,
    'vertical',
    'left',
    BORDER_SEEDS.left + 500
  );

  ctx.restore();
}

/**
 * Render the right border region.
 */
function renderRightBorder(
  ctx: CanvasRenderingContext2D,
  worldScreenRight: number,
  worldScreenTop: number,
  worldScreenBottom: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  if (worldScreenRight >= viewportWidth) return; // Border not visible

  const borderWidth = Math.min(viewportWidth - worldScreenRight, BORDER_DEPTH);
  const visibleTop = Math.max(0, worldScreenTop);
  const visibleBottom = Math.min(viewportHeight, worldScreenBottom);
  const visibleHeight = visibleBottom - visibleTop;

  if (visibleHeight <= 0) return;

  const totalBorderHeight = worldScreenBottom - worldScreenTop;

  ctx.save();
  ctx.beginPath();
  ctx.rect(worldScreenRight - FOREST_FRINGE_DEPTH, visibleTop, borderWidth + FOREST_FRINGE_DEPTH, visibleHeight);
  ctx.clip();

  // Green gradient zone
  const gradient = ctx.createLinearGradient(worldScreenRight, 0, worldScreenRight + borderWidth, 0);
  gradient.addColorStop(0, BORDER_COLORS.greenGradientEnd);
  gradient.addColorStop(0.7, BORDER_COLORS.greenZone);
  gradient.addColorStop(1, BORDER_COLORS.outerDark);

  ctx.fillStyle = gradient;
  ctx.fillRect(worldScreenRight, worldScreenTop, borderWidth, totalBorderHeight);

  // Forest fringe - use WORLD coordinates
  drawForestFringe(
    ctx,
    worldScreenRight,
    worldScreenTop,
    totalBorderHeight,
    FOREST_FRINGE_DEPTH,
    'vertical',
    'right',
    BORDER_SEEDS.right
  );

  // Vine texture
  drawVineBorderTexture(
    ctx,
    worldScreenRight,
    worldScreenTop,
    totalBorderHeight,
    VINE_THICKNESS,
    'vertical',
    'right',
    BORDER_SEEDS.right + 500
  );

  ctx.restore();
}

/**
 * Render the top border region.
 */
function renderTopBorder(
  ctx: CanvasRenderingContext2D,
  worldScreenLeft: number,
  worldScreenRight: number,
  worldScreenTop: number,
  viewportWidth: number
): void {
  if (worldScreenTop <= 0) return; // Border not visible

  const borderHeight = Math.min(worldScreenTop, BORDER_DEPTH);
  const visibleLeft = Math.max(0, worldScreenLeft);
  const visibleRight = Math.min(viewportWidth, worldScreenRight);
  const visibleWidth = visibleRight - visibleLeft;

  if (visibleWidth <= 0) return;

  const totalBorderWidth = worldScreenRight - worldScreenLeft;

  ctx.save();
  ctx.beginPath();
  ctx.rect(visibleLeft, worldScreenTop - borderHeight - FOREST_FRINGE_DEPTH, visibleWidth, borderHeight + FOREST_FRINGE_DEPTH);
  ctx.clip();

  // Green gradient zone
  const gradient = ctx.createLinearGradient(0, worldScreenTop - borderHeight, 0, worldScreenTop);
  gradient.addColorStop(0, BORDER_COLORS.outerDark);
  gradient.addColorStop(0.3, BORDER_COLORS.greenZone);
  gradient.addColorStop(1, BORDER_COLORS.greenGradientEnd);

  ctx.fillStyle = gradient;
  ctx.fillRect(worldScreenLeft, worldScreenTop - borderHeight, totalBorderWidth, borderHeight);

  // Forest fringe - use WORLD coordinates
  drawForestFringe(
    ctx,
    worldScreenLeft,
    worldScreenTop,
    totalBorderWidth,
    FOREST_FRINGE_DEPTH,
    'horizontal',
    'up',
    BORDER_SEEDS.top
  );

  // Vine texture
  drawVineBorderTexture(
    ctx,
    worldScreenLeft,
    worldScreenTop,
    totalBorderWidth,
    VINE_THICKNESS,
    'horizontal',
    'up',
    BORDER_SEEDS.top + 500
  );

  ctx.restore();
}

/**
 * Render the bottom border region.
 */
function renderBottomBorder(
  ctx: CanvasRenderingContext2D,
  worldScreenLeft: number,
  worldScreenRight: number,
  worldScreenBottom: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  if (worldScreenBottom >= viewportHeight) return; // Border not visible

  const borderHeight = Math.min(viewportHeight - worldScreenBottom, BORDER_DEPTH);
  const visibleLeft = Math.max(0, worldScreenLeft);
  const visibleRight = Math.min(viewportWidth, worldScreenRight);
  const visibleWidth = visibleRight - visibleLeft;

  if (visibleWidth <= 0) return;

  const totalBorderWidth = worldScreenRight - worldScreenLeft;

  ctx.save();
  ctx.beginPath();
  ctx.rect(visibleLeft, worldScreenBottom, visibleWidth, borderHeight + FOREST_FRINGE_DEPTH);
  ctx.clip();

  // Green gradient zone
  const gradient = ctx.createLinearGradient(0, worldScreenBottom, 0, worldScreenBottom + borderHeight);
  gradient.addColorStop(0, BORDER_COLORS.greenGradientEnd);
  gradient.addColorStop(0.7, BORDER_COLORS.greenZone);
  gradient.addColorStop(1, BORDER_COLORS.outerDark);

  ctx.fillStyle = gradient;
  ctx.fillRect(worldScreenLeft, worldScreenBottom, totalBorderWidth, borderHeight);

  // Forest fringe - use WORLD coordinates
  drawForestFringe(
    ctx,
    worldScreenLeft,
    worldScreenBottom,
    totalBorderWidth,
    FOREST_FRINGE_DEPTH,
    'horizontal',
    'down',
    BORDER_SEEDS.bottom
  );

  // Vine texture
  drawVineBorderTexture(
    ctx,
    worldScreenLeft,
    worldScreenBottom,
    totalBorderWidth,
    VINE_THICKNESS,
    'horizontal',
    'down',
    BORDER_SEEDS.bottom + 500
  );

  ctx.restore();
}

