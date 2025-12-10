import {
  PLAYER_RADIUS,
  SWORD_COOLDOWN_MS,
  SWORD_DAMAGE,
  type AttackDirection,
} from '@garama/shared';

import type { PlayerState } from './players';

type Hitbox = { x: number; y: number; w: number; h: number };

function attackHitbox(origin: PlayerState, direction: AttackDirection): Hitbox {
  const reach = 60;
  const height = 50;

  if (direction === 'right') {
    return { x: origin.x + PLAYER_RADIUS, y: origin.y - height / 2, w: reach, h: height };
  }

  if (direction === 'left') {
    return { x: origin.x - PLAYER_RADIUS - reach, y: origin.y - height / 2, w: reach, h: height };
  }

  if (direction === 'up') {
    return { x: origin.x - reach / 2, y: origin.y + PLAYER_RADIUS, w: reach, h: height };
  }

  // down
  return { x: origin.x - reach / 2, y: origin.y - PLAYER_RADIUS - height, w: reach, h: height };
}

function rectCircleOverlap(rect: Hitbox, circle: { x: number; y: number; radius: number }) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

export function canStartAttack(attacker: PlayerState, direction: AttackDirection, isAirborne: boolean) {
  const now = Date.now();
  if (now - attacker.lastAttackAt < SWORD_COOLDOWN_MS) return false;
  if (direction === 'down' && !isAirborne) return false;
  return true;
}

export function resolveAttack(
  attacker: PlayerState,
  direction: AttackDirection,
  isAirborne: boolean,
  players: Map<string, PlayerState>
) {
  if (!canStartAttack(attacker, direction, isAirborne)) return [];

  attacker.lastAttackAt = Date.now();
  const hitbox = attackHitbox(attacker, direction);

  const hits: { targetId: string; nextHp: number; isKill: boolean }[] = [];

  players.forEach((target, targetId) => {
    if (targetId === attacker.id) return;
    if (target.isDead) return;

    const overlaps = rectCircleOverlap(hitbox, {
      x: target.x,
      y: target.y,
      radius: PLAYER_RADIUS,
    });

    if (!overlaps) return;

    const nextHp = Math.max(0, target.hp - SWORD_DAMAGE);
    hits.push({ targetId, nextHp, isKill: nextHp === 0 });
  });

  return hits;
}

