import type { StaticObject } from '@garama/shared';
import { STATIC_OBJECTS } from '@garama/shared';

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
  players: new Map<string, Player>(),
  localPlayerId: null,
  camera: { x: 0, y: 0 },
  viewportWidth: 0,
  viewportHeight: 0,
  objects: STATIC_OBJECTS,
  debugCollisions: false,
};

export function spawnPlayer(id: string, name: string, mapWidth: number, mapHeight: number, radius: number, color: string): Player {
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
