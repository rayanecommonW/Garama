import {
  MAP_HEIGHT,
  MAP_WIDTH,
  PLAYER_COLOR,
  PLAYER_MAX_HEALTH,
  PLAYER_RADIUS,
  type ClientMessage,
  type PlayerData,
  type Point,
  type StaticObject,
  circlePolygonCollision,
  resolveCirclePolygonCollision,
} from '@garama/shared';

export type PlayerState = PlayerData & {
  lastAttackAt: number;
};

export const players = new Map<string, PlayerState>();

function clampToMap(x: number, y: number) {
  const nx = Math.max(PLAYER_RADIUS, Math.min(MAP_WIDTH - PLAYER_RADIUS, x));
  const ny = Math.max(PLAYER_RADIUS, Math.min(MAP_HEIGHT - PLAYER_RADIUS, y));
  return { x: nx, y: ny };
}

export function createPlayer(id: string, name: string): PlayerState {
  return {
    id,
    name,
    x: 0,
    y: 0,
    color: PLAYER_COLOR,
    hp: PLAYER_MAX_HEALTH,
    score: 0,
    isDead: false,
    lastAttackAt: -Infinity,
  };
}

export function handlePositionUpdate(
  player: PlayerState,
  msg: ClientMessage & { type: 'position' },
  objects: StaticObject[]
) {
  if (player.isDead) return;

  const { x: newX, y: newY } = clampToMap(msg.x, msg.y);

  let finalX = newX;
  let finalY = newY;

  for (const obj of objects) {
    if (!obj.isCollision) continue;
    const newCenter: Point = [finalX, finalY];

    if (circlePolygonCollision(newCenter, PLAYER_RADIUS, obj.polygon)) {
      const [pushX, pushY] = resolveCirclePolygonCollision(newCenter, PLAYER_RADIUS, obj.polygon);
      finalX += pushX;
      finalY += pushY;
    }
  }

  player.x = finalX;
  player.y = finalY;
}

