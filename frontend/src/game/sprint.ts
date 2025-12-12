import { DASH_DURATION_MS } from './dash';
import { Input } from './input';

import type { Player } from './gameState';

const SPRINT_ENABLE_HELD_MS = DASH_DURATION_MS;

let dashHeldMs = 0;

/**
 * Updates the player's sprint state based on holding the dash key.
 */
export function updateSprint(player: Player, deltaMs: number, isDashing: boolean) {
  if (!Input.dash) {
    dashHeldMs = 0;
    player.isSprinting = false;
    return player.isSprinting;
  }

  dashHeldMs += deltaMs;
  const canSprint = !isDashing && player.onGround && dashHeldMs >= SPRINT_ENABLE_HELD_MS;
  player.isSprinting = canSprint;
  return player.isSprinting;
}


