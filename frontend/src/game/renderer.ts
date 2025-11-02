import {
  MAP_GRID_CELL_SIZE,
  MAP_GRID_DOT_SIZE,
  MAP_GRID_COLOR,
  MAP_BORDER_COLOR,
  MAP_BORDER_WIDTH,
  MAP_OUTSIDE_COLOR,
  MAP_WIDTH,
  MAP_HEIGHT,
} from '@garama/shared';
import { GameStateType } from './gameState';

/**
 * Renders the game map and entities to canvas
 */
export function renderFrame(canvas: HTMLCanvasElement, gameState: GameStateType) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const viewportWidth = canvas.width;
  const viewportHeight = canvas.height;

  // Update viewport dimensions in game state
  gameState.viewportWidth = viewportWidth;
  gameState.viewportHeight = viewportHeight;

  // Calculate camera bounds (what part of the world is visible)
  const cameraLeft = gameState.camera.x - viewportWidth / 2;
  const cameraTop = gameState.camera.y - viewportHeight / 2;
  const cameraRight = cameraLeft + viewportWidth;
  const cameraBottom = cameraTop + viewportHeight;

  // Fill entire viewport with gray (outside color)
  ctx.fillStyle = MAP_OUTSIDE_COLOR;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  // Calculate world map bounds in screen coordinates
  const worldLeft = 0 - cameraLeft;
  const worldTop = 0 - cameraTop;
  const worldRight = MAP_WIDTH - cameraLeft;
  const worldBottom = MAP_HEIGHT - cameraTop;

  // Draw black background for world map area (only visible portion)
  ctx.fillStyle = '#000000';
  const visibleWorldLeft = Math.max(0, worldLeft);
  const visibleWorldTop = Math.max(0, worldTop);
  const visibleWorldRight = Math.min(viewportWidth, worldRight);
  const visibleWorldBottom = Math.min(viewportHeight, worldBottom);

  if (visibleWorldRight > visibleWorldLeft && visibleWorldBottom > visibleWorldTop) {
    ctx.fillRect(visibleWorldLeft, visibleWorldTop, visibleWorldRight - visibleWorldLeft, visibleWorldBottom - visibleWorldTop);
  }

  // Draw world border
  ctx.strokeStyle = MAP_BORDER_COLOR;
  ctx.lineWidth = MAP_BORDER_WIDTH;

  // Only draw border segments that are visible
  if (worldLeft >= 0 && worldLeft <= viewportWidth) {
    // Left border
    const visibleTop = Math.max(0, worldTop);
    const visibleBottom = Math.min(viewportHeight, worldBottom);
    if (visibleBottom > visibleTop) {
      ctx.beginPath();
      ctx.moveTo(worldLeft, visibleTop);
      ctx.lineTo(worldLeft, visibleBottom);
      ctx.stroke();
    }
  }

  if (worldRight >= 0 && worldRight <= viewportWidth) {
    // Right border
    const visibleTop = Math.max(0, worldTop);
    const visibleBottom = Math.min(viewportHeight, worldBottom);
    if (visibleBottom > visibleTop) {
      ctx.beginPath();
      ctx.moveTo(worldRight, visibleTop);
      ctx.lineTo(worldRight, visibleBottom);
      ctx.stroke();
    }
  }

  if (worldTop >= 0 && worldTop <= viewportHeight) {
    // Top border
    const visibleLeft = Math.max(0, worldLeft);
    const visibleRight = Math.min(viewportWidth, worldRight);
    if (visibleRight > visibleLeft) {
      ctx.beginPath();
      ctx.moveTo(visibleLeft, worldTop);
      ctx.lineTo(visibleRight, worldTop);
      ctx.stroke();
    }
  }

  if (worldBottom >= 0 && worldBottom <= viewportHeight) {
    // Bottom border
    const visibleLeft = Math.max(0, worldLeft);
    const visibleRight = Math.min(viewportWidth, worldRight);
    if (visibleRight > visibleLeft) {
      ctx.beginPath();
      ctx.moveTo(visibleLeft, worldBottom);
      ctx.lineTo(visibleRight, worldBottom);
      ctx.stroke();
    }
  }

  // Draw grid dots at intersections (only within world bounds)
  ctx.fillStyle = MAP_GRID_COLOR;

  // Calculate which grid intersections are visible
  const startGridX = Math.max(0, Math.floor(cameraLeft / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE);
  const endGridX = Math.min(MAP_WIDTH, Math.ceil(cameraRight / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE);
  const startGridY = Math.max(0, Math.floor(cameraTop / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE);
  const endGridY = Math.min(MAP_HEIGHT, Math.ceil(cameraBottom / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE);

  // Draw grid dots
  for (let x = startGridX; x <= endGridX; x += MAP_GRID_CELL_SIZE) {
    for (let y = startGridY; y <= endGridY; y += MAP_GRID_CELL_SIZE) {
      const screenX = x - cameraLeft;
      const screenY = y - cameraTop;

      // Only draw if within viewport
      if (screenX >= 0 && screenX <= viewportWidth && screenY >= 0 && screenY <= viewportHeight) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, MAP_GRID_DOT_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw players
  gameState.players.forEach((player) => {
    // Convert world coordinates to screen coordinates
    const screenX = player.x - cameraLeft;
    const screenY = player.y - cameraTop;

    // Only draw if player is visible in viewport
    if (
      screenX + player.radius >= 0 &&
      screenX - player.radius <= viewportWidth &&
      screenY + player.radius >= 0 &&
      screenY - player.radius <= viewportHeight
    ) {
      // Draw player circle
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, player.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw player name above the player
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const nameY = screenY - player.radius - 4; // 4 pixels above the circle
      ctx.fillText(player.name, screenX, nameY);
    }
  });
}

