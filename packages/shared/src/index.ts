// Shared types and constants for Garama game
export type Direction = 'up' | 'down' | 'left' | 'right' | 'stop';

export type PlayerSnapshot = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
};

export type PlayerState = PlayerSnapshot & {
  lastSeen: number;
};

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

export type ClientMessage =
  | { type: 'join'; name?: unknown; clientId?: unknown }
  | { type: 'input'; direction?: unknown };

export type ServerMessage =
  | { type: 'welcome'; myId: string; player: PlayerState }
  | { type: 'gameState'; players: PlayerSnapshot[] };

// Game constants
export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;
export const TICK_RATE = 20; // Hz
export const PLAYER_SPEED = 280 / TICK_RATE; // ~280 world units per second
export const INACTIVITY_TIMEOUT = 60_000; // 60 seconds
