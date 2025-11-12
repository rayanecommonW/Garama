import { Input } from './input';
import { JUMP_INITIAL_SPEED, JUMP_HOLD_ACCEL, JUMP_MAX_HOLD_MS } from '@garama/shared';
import type { Player } from './gameState';

const COYOTE_TIME_MS = 120;
const JUMP_BUFFER_MS = 120;

let wasZDown = false;
let coyoteMs = 0;
let jumpBufferMs = 0;

export function processJump(player: Player, deltaMs: number) {
  const zEdge = Input.z && !wasZDown;
  if (zEdge) jumpBufferMs = JUMP_BUFFER_MS;

  const canJumpNow = (player.onGround || coyoteMs > 0) && jumpBufferMs > 0;
  if (canJumpNow) {
    player.vy = JUMP_INITIAL_SPEED;
    player.onGround = false;
    player.jumpHoldMs = 0;
    jumpBufferMs = 0;
    coyoteMs = 0;
  }

  if (Input.z && player.vy > 0 && player.jumpHoldMs < JUMP_MAX_HOLD_MS) {
    const hold = Math.min(JUMP_MAX_HOLD_MS - player.jumpHoldMs, deltaMs);
    player.vy += JUMP_HOLD_ACCEL * (hold / 1000);
    player.jumpHoldMs += hold;
  }

  if (player.onGround) {
    coyoteMs = COYOTE_TIME_MS;
  } else {
    coyoteMs = Math.max(0, coyoteMs - deltaMs);
  }
  jumpBufferMs = Math.max(0, jumpBufferMs - deltaMs);
  wasZDown = Input.z;
}


