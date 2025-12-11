import {
  STATIC_OBJECTS,
  PLAYER_MAX_HEALTH,
  type StaticObject,
  type Point,
  type AttackDirection,
} from '@garama/shared';

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
  hp: number;
  isDead: boolean;
  hitFlashMs?: number;
  attackMsLeft?: number;
  attackDir?: AttackDirection;
  facing?: AttackDirection;
  dashMsLeft: number;
  dashCooldownMs: number;
  dashDir: AttackDirection;
  canAirDash: boolean;
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

export type MouseState = {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
};

export type GameStateType = {
  players: Map<string, Player>;
  localPlayerId: string | null;
  camera: Camera;
  viewportWidth: number;
  viewportHeight: number;
  objects: RenderableObject[];
  debugCollisions: boolean;
  freeCamMode: boolean;
  freeCamZoom: number;
  showCoordinates: boolean;
  mouse: MouseState;
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
  freeCamMode: false,
  freeCamZoom: 1,
  showCoordinates: false,
  mouse: { screenX: 0, screenY: 0, worldX: 0, worldY: 0 },
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
    hp: PLAYER_MAX_HEALTH,
    isDead: false,
    attackMsLeft: 0,
    facing: 'right',
    dashMsLeft: 0,
    dashCooldownMs: 0,
    dashDir: 'right',
    canAirDash: true,
  };

  GameState.players.set(id, player);

  GameState.camera.x = x;
  GameState.camera.y = y;

  return player;
}
