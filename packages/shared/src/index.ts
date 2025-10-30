// Shared types and constants for simple Socket.IO connection
export const TICK_RATE = 20; // Hz - server tick rate

export type ClientMessage =
  | { type: 'ok' }
  | { type: 'chat'; message: string };

export type ServerMessage =
  | { type: 'tick'; timestamp: number }
  | { type: 'chat'; message: string; from?: string };