/**
 * Debug Renderer Module
 * Renders debug overlays like coordinates, hitboxes, and indicators.
 */

import { DEBUG_HITBOX_COLOR, DEBUG_PLAYER_HITBOX_COLOR } from '@garama/shared';

import type { GameStateType, RenderableObject } from './gameState';
import type { Point } from '@garama/shared';

// ============================================================================
// Mouse Coordinates Overlay
// ============================================================================

/** Renders world coordinates near the mouse cursor */
export function renderMouseCoordinates(ctx: CanvasRenderingContext2D, gameState: GameStateType) {
  const { screenX, screenY, worldX, worldY } = gameState.mouse;

  const text = `(${worldX}, ${worldY})`;
  const offsetX = 15;
  const offsetY = -10;

  ctx.save();
  ctx.font = 'bold 12px monospace';

  // Measure text for background
  const metrics = ctx.measureText(text);
  const padding = 4;
  const bgWidth = metrics.width + padding * 2;
  const bgHeight = 16 + padding * 2;

  // Draw background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(
    screenX + offsetX - padding,
    screenY + offsetY - bgHeight + padding,
    bgWidth,
    bgHeight
  );

  // Draw border
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    screenX + offsetX - padding,
    screenY + offsetY - bgHeight + padding,
    bgWidth,
    bgHeight
  );

  // Draw text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, screenX + offsetX, screenY + offsetY);

  // Draw crosshair at mouse position
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(screenX - 10, screenY);
  ctx.lineTo(screenX + 10, screenY);
  ctx.moveTo(screenX, screenY - 10);
  ctx.lineTo(screenX, screenY + 10);
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// Free Cam Indicator
// ============================================================================

/** Renders an indicator when free cam mode is active */
export function renderFreeCamIndicator(
  ctx: CanvasRenderingContext2D,
  viewportWidth: number,
  zoom: number
) {
  ctx.save();

  const zoomPercent = Math.round(zoom * 100);
  const text = `📷 FREE CAM | Zoom: ${zoomPercent}%`;
  const helpText = 'Arrows/WASD: move | Drag: pan | Scroll/+−: zoom';

  ctx.font = 'bold 14px sans-serif';
  const metrics = ctx.measureText(text);

  const x = viewportWidth / 2 - metrics.width / 2;
  const y = 30;

  // Background
  ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
  ctx.fillRect(x - 10, y - 18, metrics.width + 20, 44);

  // Main text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);

  // Help text
  ctx.font = '11px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  const helpMetrics = ctx.measureText(helpText);
  ctx.fillText(helpText, viewportWidth / 2 - helpMetrics.width / 2, y + 18);

  ctx.restore();
}

// ============================================================================
// Debug Hitboxes
// ============================================================================

/** Renders debug hitboxes for objects and players */
export function renderDebugHitboxes(
  ctx: CanvasRenderingContext2D,
  gameState: GameStateType,
  cameraLeft: number,
  cameraTop: number,
  viewportHeight: number
) {
  // Render object hitboxes
  ctx.strokeStyle = DEBUG_HITBOX_COLOR;
  ctx.lineWidth = 2;

  gameState.objects.forEach((obj: RenderableObject) => {
    const screenPolygon: Point[] = obj.polygon.map(([x, y]: Point) => {
      const screenX = x - cameraLeft;
      const screenY = viewportHeight - (y - cameraTop);
      return [screenX, screenY] as Point;
    });

    ctx.beginPath();
    ctx.moveTo(screenPolygon[0][0], screenPolygon[0][1]);
    for (let i = 1; i < screenPolygon.length; i++) {
      ctx.lineTo(screenPolygon[i][0], screenPolygon[i][1]);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = DEBUG_HITBOX_COLOR;
    screenPolygon.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // Render player hitboxes
  ctx.strokeStyle = DEBUG_PLAYER_HITBOX_COLOR;
  ctx.lineWidth = 2;

  gameState.players.forEach((player) => {
    const screenX = player.x - cameraLeft;
    const screenY = viewportHeight - (player.y - cameraTop);

    ctx.beginPath();
    ctx.arc(screenX, screenY, player.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = DEBUG_PLAYER_HITBOX_COLOR;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

