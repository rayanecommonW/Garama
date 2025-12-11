import { Input } from './input';

import type { Player } from './gameState';
import type { AttackDirection } from '@garama/shared';

export const DASH_SPEED = 1800;
export const DASH_DURATION_MS = 240;
export const DASH_COOLDOWN_MS = 500;

let wasDashDown = false;

/**
 * Handles dash input, timers, and velocity updates. Returns true when dashing.
 */
export function updateDash(player: Player, deltaMs: number) {
  player.dashCooldownMs = Math.max(0, player.dashCooldownMs - deltaMs);

  const dashEdge = Input.dash && !wasDashDown;
  const canStartDash = dashEdge && player.dashCooldownMs <= 0 && (player.onGround || player.canAirDash);
  if (canStartDash) {
    const dashDir: AttackDirection = player.facing === 'left' ? 'left' : 'right';
    player.dashDir = dashDir;
    player.dashMsLeft = DASH_DURATION_MS;
    player.dashCooldownMs = DASH_COOLDOWN_MS;
    player.vy = 0;
    player.vx = (dashDir === 'left' ? -1 : 1) * DASH_SPEED;
    if (!player.onGround) player.canAirDash = false;
  }

  const isDashing = player.dashMsLeft > 0;
  if (isDashing) {
    player.dashMsLeft = Math.max(0, player.dashMsLeft - deltaMs);
    player.vx = (player.dashDir === 'left' ? -1 : 1) * DASH_SPEED;
    player.vy = 0;
  }

  wasDashDown = Input.dash;
  return isDashing;
}
