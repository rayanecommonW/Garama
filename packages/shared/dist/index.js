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
// Collision debug colors
export const DEBUG_HITBOX_COLOR = '#ff0000'; // red for polygon hitboxes
export const DEBUG_PLAYER_HITBOX_COLOR = '#ffff00'; // yellow for player hitbox
// Import and export static objects from JSON
import objectsData from '../objects.json';
export const STATIC_OBJECTS = objectsData.objects;
// Export collision functions
export { pointInPolygon, circlePolygonCollision, resolveCirclePolygonCollision, checkCircleMovementCollision, } from './collision';
