import objectsData from '../objects.json';

export const TICK_RATE = 20;

export const MAP_GRID_CELL_SIZE = 32;
export const MAP_GRID_DOT_SIZE = 2;
export const MAP_GRID_COLOR = '#ffffff';
export const MAP_BORDER_COLOR = '#ffffff';
export const MAP_BORDER_WIDTH = 2;
export const MAP_OUTSIDE_COLOR = '#1a1a1a';
export const MAP_HEADER_HEIGHT = 73;
export const MAP_WIDTH = 10000;
export const MAP_HEIGHT = 10000;
export const PLAYER_RADIUS = 16;
export const PLAYER_COLOR = '#3b82f6';
export const PLAYER_SPEED = 700;
export const PLAYER_MAX_HEALTH = 100;
export const SWORD_DAMAGE = 20;
export const SWORD_COOLDOWN_MS = 500;
export const SWORD_ATTACK = {
  totalDuration: 18,
  damage: SWORD_DAMAGE,
  phases: [
    { frame: 0, type: 'startup' as const },
    { frame: 4, type: 'active' as const, rect: { x: 18, y: -10, w: 34, h: 46 } },
    { frame: 12, type: 'recovery' as const },
  ],
};

export const GRAVITY = 3000;
export const JUMP_INITIAL_SPEED = 2000;
export const JUMP_HOLD_ACCEL = 1800;
export const JUMP_MAX_HOLD_MS = 180;
export const MAX_FALL_SPEED = 3000;

export const DEBUG_HITBOX_COLOR = '#ff0000';
export const DEBUG_PLAYER_HITBOX_COLOR = '#ffff00';

export type Point = [number, number];

export type RenderStyle = 'stone-wall' | 'wooden-barrier' | 'metal';

export const PLAYER_Z_INDEX = 50;

export type RawStaticObject = {
  id: string;
  position: Point;
  width: number;
  height: number;
  renderStyle: RenderStyle;
  isCollision?: boolean;
  zIndex?: number;
};

export type StaticObject = {
  id: string;
  polygon: Point[];
  renderStyle: RenderStyle;
  isCollision: boolean;
  zIndex: number;
};

function rawToPolygon(raw: RawStaticObject): StaticObject {
  const [cx, cy] = raw.position;
  const halfW = raw.width / 2;
  const halfH = raw.height / 2;

  return {
    id: raw.id,
    polygon: [
      [cx - halfW, cy - halfH],
      [cx + halfW, cy - halfH],
      [cx + halfW, cy + halfH],
      [cx - halfW, cy + halfH],
    ],
    renderStyle: raw.renderStyle,
    isCollision: raw.isCollision !== false,
    zIndex: raw.zIndex ?? 0,
  };
}

export type PlayerData = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  hp: number;
  isDead?: boolean;
};

export type AttackDirection = 'left' | 'right' | 'up' | 'down';

export type ClientMessage =
  | { type: 'ok' }
  | { type: 'chat'; message: string }
  | { type: 'join'; name: string }
  | { type: 'position'; x: number; y: number }
  | { type: 'attack_start'; direction: AttackDirection; isAirborne: boolean; clientTime: number };

export type ServerMessage =
  | { type: 'tick'; timestamp: number }
  | { type: 'chat'; message: string; from?: string }
  | { type: 'snapshot'; players: PlayerData[]; timestamp: number; serverTick: number }
  | { type: 'damage'; targetId: string; hp: number }
  | { type: 'death'; targetId: string };

export const STATIC_OBJECTS: StaticObject[] = (objectsData.objects as RawStaticObject[]).map(rawToPolygon);

export {
  pointInPolygon,
  circlePolygonCollision,
  resolveCirclePolygonCollision,
  checkCircleMovementCollision,
} from './collision';
