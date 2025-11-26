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

export const GRAVITY = 3000;
export const JUMP_INITIAL_SPEED = 2000;
export const JUMP_HOLD_ACCEL = 1800;
export const JUMP_MAX_HOLD_MS = 180;
export const MAX_FALL_SPEED = 3000;

export const DEBUG_HITBOX_COLOR = '#ff0000';
export const DEBUG_PLAYER_HITBOX_COLOR = '#ffff00';

export type Point = [number, number];

export type RenderStyle = 'stone-wall' | 'wooden-barrier' | 'metal';

export type StaticObject = {
  id: string;
  polygon: Point[];
  renderStyle: RenderStyle;
};

export type PlayerData = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
};

export type ClientMessage =
  | { type: 'ok' }
  | { type: 'chat'; message: string }
  | { type: 'join'; name: string }
  | { type: 'position'; x: number; y: number };

export type ServerMessage =
  | { type: 'tick'; timestamp: number }
  | { type: 'chat'; message: string; from?: string }
  | { type: 'snapshot'; players: PlayerData[]; timestamp: number; serverTick: number };
export const STATIC_OBJECTS: StaticObject[] = objectsData.objects as StaticObject[];

export {
  pointInPolygon,
  circlePolygonCollision,
  resolveCirclePolygonCollision,
  checkCircleMovementCollision,
} from './collision';
