/**
 * Game state module - plain JS object for per-frame game data
 * Never put this in React state - keep it in plain JS for performance
 */

import type { StaticObject } from '@garama/shared';
import { STATIC_OBJECTS } from '@garama/shared';

export type Player = {
  id: string;
  name: string;
  x: number; // world position x
  y: number; // world position y
  vx: number; // horizontal velocity (px/s)
  vy: number; // vertical velocity (px/s)
  onGround: boolean; // true when standing on ground
  jumpHoldMs: number; // how long jump has been held in current jump (ms)
  radius: number;
  color: string;
};

export type Camera = {
  x: number; // world position x (center of viewport)
  y: number; // world position y (center of viewport)
};

export type GameStateType = {
  players: Map<string, Player>;
  localPlayerId: string | null;
  camera: Camera;
  viewportWidth: number;
  viewportHeight: number;
  objects: StaticObject[];
  debugCollisions: boolean;
};

export const GameState: GameStateType = {
  // Players map
  players: new Map<string, Player>(),
  
  // Local player ID
  localPlayerId: null,
  
  // Camera position (follows local player)
  camera: { x: 0, y: 0 },
  
  // Viewport dimensions (set by renderer)
  viewportWidth: 0,
  viewportHeight: 0,
  
  // Static objects loaded from shared
  objects: STATIC_OBJECTS,
  
  // Debug mode flag
  debugCollisions: false,
};

/**
 * Spawns a player at position (0, 0)
 */
export function spawnPlayer(id: string, name: string, mapWidth: number, mapHeight: number, radius: number, color: string): Player {
  const x = 0;
  const y = radius; // spawn on ground level
  
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
  
  // Set camera to player position
  GameState.camera.x = x;
  GameState.camera.y = y;
  
  return player;
}

