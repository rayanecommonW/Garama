// Shared types and constants for simple Socket.IO connection
export const TICK_RATE = 20; // Hz - server tick rate

// Map constants
export const MAP_GRID_CELL_SIZE = 32; // pixels per grid cell
export const MAP_GRID_DOT_SIZE = 2; // pixels - size of grid intersection dots
export const MAP_GRID_COLOR = '#ffffff'; // white
export const MAP_BORDER_COLOR = '#ffffff'; // white border around world
export const MAP_BORDER_WIDTH = 2; // pixels
export const MAP_OUTSIDE_COLOR = '#1a1a1a'; // gray color for outside world
export const MAP_HEADER_HEIGHT = 73; // header height in pixels
export const MAP_WIDTH = 10000; // world map width in pixels
export const MAP_HEIGHT = 10000; // world map height in pixels
export const PLAYER_RADIUS = 16; // player circle radius in pixels
export const PLAYER_COLOR = '#3b82f6'; // player color (blue)
export const PLAYER_SPEED = 200; // pixels per second
/**
 * Gravity and jump tuning (pixels, seconds)
 */
export const GRAVITY = 2000; // px/s^2 - downward acceleration
export const JUMP_INITIAL_SPEED = 700; // px/s - initial upward velocity on jump
export const JUMP_HOLD_ACCEL = 1200; // px/s^2 - extra upward accel while holding jump
export const JUMP_MAX_HOLD_MS = 180; // ms - max duration for variable jump hold
export const MAX_FALL_SPEED = 1400; // px/s - terminal downward velocity

// Collision debug colors
export const DEBUG_HITBOX_COLOR = '#ff0000'; // red for polygon hitboxes
export const DEBUG_PLAYER_HITBOX_COLOR = '#ffff00'; // yellow for player hitbox

// Static object types
export type Point = [number, number];

export type RenderStyle = 'stone-wall' | 'wooden-barrier' | 'metal';

export type StaticObject = {
  id: string;
  polygon: Point[]; // Array of [x, y] points defining the hitbox
  renderStyle: RenderStyle;
};

// Player data shared between client and server
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

// Import and export static objects from JSON
import objectsData from '../objects.json';
export const STATIC_OBJECTS: StaticObject[] = objectsData.objects as StaticObject[];

// Export collision functions
export {
  pointInPolygon,
  circlePolygonCollision,
  resolveCirclePolygonCollision,
  checkCircleMovementCollision,
} from './collision';