import {
  JUMP_INITIAL_SPEED,
  JUMP_HOLD_ACCEL,
  JUMP_MAX_HOLD_MS,
  SPRINT_JUMP_INITIAL_SPEED,
  SPRINT_JUMP_MAX_HOLD_MS,
} from '@garama/shared';

import { Input } from './input';

import type { Player } from './gameState';

const COYOTE_TIME_MS = 120;
const JUMP_BUFFER_MS = 120;

let wasJumpDown = false;
let coyoteMs = 0;
let jumpBufferMs = 0;
let currentMaxHoldMs = JUMP_MAX_HOLD_MS;

type ProcessJumpOptions = {
  isSprinting?: boolean;
};

export function processJump(player: Player, deltaMs: number, options?: ProcessJumpOptions) {
  let didStartJump = false;
  const jumpEdge = Input.jump && !wasJumpDown;
  if (jumpEdge) jumpBufferMs = JUMP_BUFFER_MS;

  const canJumpNow = (player.onGround || coyoteMs > 0) && jumpBufferMs > 0;
  if (canJumpNow) {
    const isSprintJump = options?.isSprinting === true;
    currentMaxHoldMs = isSprintJump ? SPRINT_JUMP_MAX_HOLD_MS : JUMP_MAX_HOLD_MS;

    player.vy = isSprintJump ? SPRINT_JUMP_INITIAL_SPEED : JUMP_INITIAL_SPEED;
    player.onGround = false;
    player.jumpHoldMs = 0;
    jumpBufferMs = 0;
    coyoteMs = 0;
    didStartJump = true;
  }

  if (Input.jump && player.vy > 0 && player.jumpHoldMs < currentMaxHoldMs) {
    const hold = Math.min(currentMaxHoldMs - player.jumpHoldMs, deltaMs);
    player.vy += JUMP_HOLD_ACCEL * (hold / 1000);
    player.jumpHoldMs += hold;
  }

  if (player.onGround) {
    coyoteMs = COYOTE_TIME_MS;
  } else {
    coyoteMs = Math.max(0, coyoteMs - deltaMs);
  }
  jumpBufferMs = Math.max(0, jumpBufferMs - deltaMs);
  wasJumpDown = Input.jump;

  return didStartJump;
}
