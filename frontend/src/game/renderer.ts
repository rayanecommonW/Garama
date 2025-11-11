import {
  MAP_GRID_CELL_SIZE,
  MAP_GRID_DOT_SIZE,
  MAP_GRID_COLOR,
  MAP_BORDER_COLOR,
  MAP_BORDER_WIDTH,
  MAP_OUTSIDE_COLOR,
  MAP_WIDTH,
  MAP_HEIGHT,
  DEBUG_HITBOX_COLOR,
  DEBUG_PLAYER_HITBOX_COLOR,
} from '@garama/shared';
import type { StaticObject, Point } from '@garama/shared';
import type { GameStateType } from './gameState';

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
  const worldTop = viewportHeight - (MAP_HEIGHT - cameraTop); 
  const worldRight = MAP_WIDTH - cameraLeft;
  const worldBottom = viewportHeight - (0 - cameraTop); 

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
      const screenY = viewportHeight - (y - cameraTop);

      // Only draw if within viewport
      if (screenX >= 0 && screenX <= viewportWidth && screenY >= 0 && screenY <= viewportHeight) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, MAP_GRID_DOT_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw static objects
  renderObjects(ctx, gameState, cameraLeft, cameraTop, viewportWidth, viewportHeight);

  // Draw players
  gameState.players.forEach((player) => {
    // Convert world coordinates to screen coordinates
    const screenX = player.x - cameraLeft;
    const screenY = viewportHeight - (player.y - cameraTop);

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
      const nameY = screenY - player.radius - 4;
      ctx.fillText(player.name, screenX, nameY);
    }
  });

  // Draw debug hitboxes if enabled
  if (gameState.debugCollisions) {
    renderDebugHitboxes(ctx, gameState, cameraLeft, cameraTop, viewportWidth, viewportHeight);
  }
}

/**
 * Renders static objects with creative visual styles
 */
function renderObjects(
  ctx: CanvasRenderingContext2D,
  gameState: GameStateType,
  cameraLeft: number,
  cameraTop: number,
  viewportWidth: number,
  viewportHeight: number
) {
  gameState.objects.forEach((obj: StaticObject) => {
    // Convert world polygon to screen coordinates
    const screenPolygon: Point[] = obj.polygon.map(([x, y]: Point) => {
      const screenX = x - cameraLeft;
      const screenY = viewportHeight - (y - cameraTop);
      return [screenX, screenY] as Point;
    });

    // Simple culling - check if any point is visible
    const isVisible = screenPolygon.some(([x, y]) => 
      x >= -100 && x <= viewportWidth + 100 && 
      y >= -100 && y <= viewportHeight + 100
    );

    if (!isVisible) return;

    // Draw based on render style
    ctx.save();
    
    switch (obj.renderStyle) {
      case 'stone-wall':
        renderStoneWall(ctx, screenPolygon);
        break;
      case 'wooden-barrier':
        renderWoodenBarrier(ctx, screenPolygon);
        break;
      case 'metal':
        renderMetal(ctx, screenPolygon);
        break;
    }
    
    ctx.restore();
  });
}

/**
 * Renders a stone wall style object
 */
function renderStoneWall(ctx: CanvasRenderingContext2D, polygon: Point[]) {
  // Fill with gray stone color
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  // Add darker border for depth
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Add brick pattern
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 1;
  
  // Calculate bounding box
  const xs = polygon.map(p => p[0]);
  const ys = polygon.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Draw horizontal lines
  for (let y = minY; y < maxY; y += 15) {
    ctx.beginPath();
    ctx.moveTo(minX, y);
    ctx.lineTo(maxX, y);
    ctx.stroke();
  }

  // Draw vertical lines (staggered)
  let offsetToggle = false;
  for (let y = minY; y < maxY; y += 15) {
    const offset = offsetToggle ? 20 : 0;
    for (let x = minX + offset; x < maxX; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 15);
      ctx.stroke();
    }
    offsetToggle = !offsetToggle;
  }
}

/**
 * Renders a wooden barrier style object
 */
function renderWoodenBarrier(ctx: CanvasRenderingContext2D, polygon: Point[]) {
  // Fill with brown wood color
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  // Add darker border
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Add wood grain lines
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  
  const xs = polygon.map(p => p[0]);
  const ys = polygon.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Vertical wood planks
  for (let x = minX; x < maxX; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x, minY);
    ctx.lineTo(x, maxY);
    ctx.stroke();
  }

  // Horizontal support beams
  const midY = (minY + maxY) / 2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(minX, midY);
  ctx.lineTo(maxX, midY);
  ctx.stroke();
}

/**
 * Renders a metal style object
 */
function renderMetal(ctx: CanvasRenderingContext2D, polygon: Point[]) {
  // Create metallic gradient
  const xs = polygon.map(p => p[0]);
  const ys = polygon.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  const gradient = ctx.createLinearGradient(minX, minY, maxX, maxY);
  gradient.addColorStop(0, '#94a3b8');
  gradient.addColorStop(0.5, '#cbd5e1');
  gradient.addColorStop(1, '#64748b');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  // Add metallic border
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Add rivets
  ctx.fillStyle = '#334155';
  polygon.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Renders debug hitboxes for objects and players
 */
function renderDebugHitboxes(
  ctx: CanvasRenderingContext2D,
  gameState: GameStateType,
  cameraLeft: number,
  cameraTop: number,
  viewportWidth: number,
  viewportHeight: number
) {
  // Draw object hitboxes
  ctx.strokeStyle = DEBUG_HITBOX_COLOR;
  ctx.lineWidth = 2;
  
  gameState.objects.forEach((obj: StaticObject) => {
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

    // Draw vertices
    ctx.fillStyle = DEBUG_HITBOX_COLOR;
    screenPolygon.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // Draw player hitboxes
  ctx.strokeStyle = DEBUG_PLAYER_HITBOX_COLOR;
  ctx.lineWidth = 2;
  
  gameState.players.forEach((player) => {
    const screenX = player.x - cameraLeft;
    const screenY = viewportHeight - (player.y - cameraTop);

    ctx.beginPath();
    ctx.arc(screenX, screenY, player.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw center point
    ctx.fillStyle = DEBUG_PLAYER_HITBOX_COLOR;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

