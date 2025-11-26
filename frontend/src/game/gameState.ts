import { STATIC_OBJECTS } from '@garama/shared';

import type { StaticObject, Point } from '@garama/shared';

export type Player = {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  jumpHoldMs: number;
  radius: number;
  color: string;
};

export type Camera = {
  x: number;
  y: number;
};

export interface RenderableObject extends StaticObject {
  boundingBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export type GameStateType = {
  players: Map<string, Player>;
  localPlayerId: string | null;
  camera: Camera;
  viewportWidth: number;
  viewportHeight: number;
  objects: RenderableObject[];
  debugCollisions: boolean;
};

function computeBoundingBox(points: Point[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

const objectsWithBounds: RenderableObject[] = STATIC_OBJECTS.map((obj) => ({
  ...obj,
  boundingBox: computeBoundingBox(obj.polygon),
}));

export const GameState: GameStateType = {
  players: new Map<string, Player>(),
  localPlayerId: null,
  camera: { x: 0, y: 0 },
  viewportWidth: 0,
  viewportHeight: 0,
  objects: objectsWithBounds,
  debugCollisions: false,
};

export function spawnPlayer(
  id: string,
  name: string,
  mapWidth: number,
  mapHeight: number,
  radius: number,
  color: string
): Player {
  const x = 0;
  const y = radius;

  const player: Player = {
    id,
    name,
    x,
    y,
    vx: 0,
    vy: 0,
    onGround: true,
    jumpHoldMs: 0,
    radius,
    color,
  };

  GameState.players.set(id, player);

  GameState.camera.x = x;
  GameState.camera.y = y;

  return player;
}
