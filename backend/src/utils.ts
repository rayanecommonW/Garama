import type { PlayerState } from '@garama/shared';
import { WORLD_WIDTH, WORLD_HEIGHT } from '@garama/shared';

export const randomColor = (): string =>
  `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

export const generatePlayerId = (): string =>
  `player-${Math.random().toString(36).slice(2, 11)}`;

export const sanitizeName = (input: unknown): string =>
  typeof input === 'string' && input.trim()
    ? input.trim().slice(0, 24)
    : 'Anonymous';

export const createPlayer = (id: string, name: string): PlayerState => ({
  id,
  name,
  x: WORLD_WIDTH / 2 + (Math.random() - 0.5) * 200,
  y: WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 200,
  color: randomColor(),
  vx: 0,
  vy: 0,
  lastSeen: Date.now(),
});

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));
