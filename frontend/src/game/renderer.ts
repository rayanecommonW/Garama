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

import type { GameStateType, RenderableObject } from './gameState';
import type { Point } from '@garama/shared';

export function renderFrame(canvas: HTMLCanvasElement, gameState: GameStateType) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const viewportWidth = canvas.width;
  const viewportHeight = canvas.height;

  gameState.viewportWidth = viewportWidth;
  gameState.viewportHeight = viewportHeight;

  const cameraLeft = gameState.camera.x - viewportWidth / 2;
  const cameraTop = gameState.camera.y - viewportHeight / 2;
  const cameraRight = cameraLeft + viewportWidth;
  const cameraBottom = cameraTop + viewportHeight;

  ctx.fillStyle = MAP_OUTSIDE_COLOR;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  renderMapBackground(ctx, cameraLeft, cameraTop, viewportWidth, viewportHeight);

  renderMapBorders(ctx, cameraLeft, cameraTop, viewportWidth, viewportHeight);

  renderGrid(ctx, cameraLeft, cameraTop, cameraRight, cameraBottom, viewportWidth, viewportHeight);

  renderObjects(
    ctx,
    gameState,
    cameraLeft,
    cameraTop,
    viewportWidth,
    viewportHeight,
    cameraRight,
    cameraBottom
  );

  renderPlayers(ctx, gameState, cameraLeft, cameraTop, viewportHeight);

  if (gameState.debugCollisions) {
    renderDebugHitboxes(ctx, gameState, cameraLeft, cameraTop, viewportHeight);
  }
}

function renderMapBackground(
  ctx: CanvasRenderingContext2D,
  cameraLeft: number,
  cameraTop: number,
  viewportWidth: number,
  viewportHeight: number
) {
  const worldLeft = 0 - cameraLeft;
  const worldTop = viewportHeight - (MAP_HEIGHT - cameraTop);
  const worldRight = MAP_WIDTH - cameraLeft;
  const worldBottom = viewportHeight - (0 - cameraTop);

  ctx.fillStyle = '#000000';
  const visibleWorldLeft = Math.max(0, worldLeft);
  const visibleWorldTop = Math.max(0, worldTop);
  const visibleWorldRight = Math.min(viewportWidth, worldRight);
  const visibleWorldBottom = Math.min(viewportHeight, worldBottom);

  if (visibleWorldRight > visibleWorldLeft && visibleWorldBottom > visibleWorldTop) {
    ctx.fillRect(
      visibleWorldLeft,
      visibleWorldTop,
      visibleWorldRight - visibleWorldLeft,
      visibleWorldBottom - visibleWorldTop
    );
  }
}

function renderMapBorders(
  ctx: CanvasRenderingContext2D,
  cameraLeft: number,
  cameraTop: number,
  viewportWidth: number,
  viewportHeight: number
) {
  ctx.strokeStyle = MAP_BORDER_COLOR;
  ctx.lineWidth = MAP_BORDER_WIDTH;

  const worldLeft = 0 - cameraLeft;
  const worldTop = viewportHeight - (MAP_HEIGHT - cameraTop);
  const worldRight = MAP_WIDTH - cameraLeft;
  const worldBottom = viewportHeight - (0 - cameraTop);

  if (worldLeft >= 0 && worldLeft <= viewportWidth) {
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
    const visibleLeft = Math.max(0, worldLeft);
    const visibleRight = Math.min(viewportWidth, worldRight);
    if (visibleRight > visibleLeft) {
      ctx.beginPath();
      ctx.moveTo(visibleLeft, worldBottom);
      ctx.lineTo(visibleRight, worldBottom);
      ctx.stroke();
    }
  }
}

function renderGrid(
  ctx: CanvasRenderingContext2D,
  cameraLeft: number,
  cameraTop: number,
  cameraRight: number,
  cameraBottom: number,
  viewportWidth: number,
  viewportHeight: number
) {
  ctx.fillStyle = MAP_GRID_COLOR;

  const startGridX = Math.max(0, Math.floor(cameraLeft / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE);
  const endGridX = Math.min(
    MAP_WIDTH,
    Math.ceil(cameraRight / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE
  );
  const startGridY = Math.max(0, Math.floor(cameraTop / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE);
  const endGridY = Math.min(
    MAP_HEIGHT,
    Math.ceil(cameraBottom / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE
  );

  for (let x = startGridX; x <= endGridX; x += MAP_GRID_CELL_SIZE) {
    for (let y = startGridY; y <= endGridY; y += MAP_GRID_CELL_SIZE) {
      const screenX = x - cameraLeft;
      const screenY = viewportHeight - (y - cameraTop);

      if (screenX >= 0 && screenX <= viewportWidth && screenY >= 0 && screenY <= viewportHeight) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, MAP_GRID_DOT_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function renderObjects(
  ctx: CanvasRenderingContext2D,
  gameState: GameStateType,
  cameraLeft: number,
  cameraTop: number, // Min Y
  viewportWidth: number,
  viewportHeight: number,
  cameraRight: number,
  cameraBottom: number // Max Y
) {
  gameState.objects.forEach((obj: RenderableObject) => {
    const isVisible =
      obj.boundingBox.maxX >= cameraLeft &&
      obj.boundingBox.minX <= cameraRight &&
      obj.boundingBox.maxY >= cameraTop &&
      obj.boundingBox.minY <= cameraBottom;

    if (!isVisible) return;

    const screenPolygon: Point[] = obj.polygon.map(([x, y]: Point) => {
      const screenX = x - cameraLeft;
      const screenY = viewportHeight - (y - cameraTop);
      return [screenX, screenY] as Point;
    });

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

function renderPlayers(
  ctx: CanvasRenderingContext2D,
  gameState: GameStateType,
  cameraLeft: number,
  cameraTop: number,
  viewportHeight: number
) {
  gameState.players.forEach((player) => {
    const screenX = player.x - cameraLeft;
    const screenY = viewportHeight - (player.y - cameraTop);

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const nameY = screenY - player.radius - 4;
    ctx.fillText(player.name, screenX, nameY);
  });
}

function renderDebugHitboxes(
  ctx: CanvasRenderingContext2D,
  gameState: GameStateType,
  cameraLeft: number,
  cameraTop: number,
  viewportHeight: number
) {
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

function renderStoneWall(ctx: CanvasRenderingContext2D, polygon: Point[]) {
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 1;

  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  for (let y = minY; y < maxY; y += 15) {
    ctx.beginPath();
    ctx.moveTo(minX, y);
    ctx.lineTo(maxX, y);
    ctx.stroke();
  }

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

function renderWoodenBarrier(ctx: CanvasRenderingContext2D, polygon: Point[]) {
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;

  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  for (let x = minX; x < maxX; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x, minY);
    ctx.lineTo(x, maxY);
    ctx.stroke();
  }

  const midY = (minY + maxY) / 2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(minX, midY);
  ctx.lineTo(maxX, midY);
  ctx.stroke();
}

function renderMetal(ctx: CanvasRenderingContext2D, polygon: Point[]) {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
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

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#334155';
  polygon.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}
