import { GameState, Player } from './gameState';
import { Input } from './input';
import {
  PLAYER_SPEED,
  MAP_WIDTH,
  MAP_HEIGHT,
  PLAYER_RADIUS,
  GRAVITY,
  MAX_FALL_SPEED,
  pointInPolygon,
  circlePolygonCollision,
  resolveCirclePolygonCollision,
} from '@garama/shared';
import type { Point } from '@garama/shared';
import { processJump } from './jump';

const GROUND_EPS = 6;
const FOOT_OFFSETS = [-PLAYER_RADIUS * 0.8, -PLAYER_RADIUS * 0.4, 0, PLAYER_RADIUS * 0.4, PLAYER_RADIUS * 0.8];

function applyHorizontal(player: typeof GameState.players extends Map<string, infer P> ? P : never, dirX: number) {
  if (player.onGround) {
    player.vx = dirX ? dirX * PLAYER_SPEED : 0;
    return;
  }
  // In air: allow changing direction or stopping completely
  player.vx = dirX ? dirX * PLAYER_SPEED : 0;
}

function applyGravity(player: typeof GameState.players extends Map<string, infer P> ? P : never, dtSec: number) {
  (player as Player).vy -= GRAVITY * dtSec;
  if ((player as Player).vy < -MAX_FALL_SPEED) (player as Player).vy = -MAX_FALL_SPEED;
}

function integrate(player: typeof GameState.players extends Map<string, infer P> ? P : never, dtSec: number) {
  return {
    x: player.x + player.vx * dtSec,
    y: player.y + player.vy * dtSec,
  };
}

function clampToMap(x: number, y: number) {
  const nx = Math.max(PLAYER_RADIUS, Math.min(MAP_WIDTH - PLAYER_RADIUS, x));
  const ny = Math.max(PLAYER_RADIUS, Math.min(MAP_HEIGHT - PLAYER_RADIUS, y));
  return { x: nx, y: ny };
}

function resolveWorldCollisions(x: number, y: number, radius: number, vy: number) {
  let fx = x;
  let fy = y;
  let landed = false;
  let hitCeil = false;
  for (const obj of GameState.objects) {
    const center: Point = [fx, fy];
    if (circlePolygonCollision(center, radius, obj.polygon)) {
      const [px, py] = resolveCirclePolygonCollision(center, radius, obj.polygon);
      fx += px;
      fy += py;
      if (py > 0) landed = true;
      else if (py < 0 && vy > 0) hitCeil = true;
    }
  }
  return { x: fx, y: fy, landed, hitCeil };
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  const cross = (p: Point, q: Point, r: Point) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const onSeg = (p: Point, q: Point, r: Point) =>
    Math.min(p[0], r[0]) <= q[0] && q[0] <= Math.max(p[0], r[0]) &&
    Math.min(p[1], r[1]) <= q[1] && q[1] <= Math.max(p[1], r[1]);
  const d1 = cross(a, b, c);
  const d2 = cross(a, b, d);
  const d3 = cross(c, d, a);
  const d4 = cross(c, d, b);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  if (d1 === 0 && onSeg(a, c, b)) return true;
  if (d2 === 0 && onSeg(a, d, b)) return true;
  if (d3 === 0 && onSeg(c, a, d)) return true;
  if (d4 === 0 && onSeg(c, b, d)) return true;
  return false;
}

function verticalSegmentIntersectsPolygon(x: number, topY: number, bottomY: number, polygon: Point[]) {
  const a: Point = [x, topY];
  const b: Point = [x, bottomY];
  for (let i = 0; i < polygon.length; i++) {
    const c = polygon[i];
    const d = polygon[(i + 1) % polygon.length];
    if (segmentsIntersect(a, b, c, d)) return true;
  }
  return false;
}

function hasGroundSupport(x: number, y: number) {
  const topY = y;
  const bottomY = y - GROUND_EPS;
  for (const obj of GameState.objects) {
    for (const ox of FOOT_OFFSETS) {
      const px = x + ox;
      if (verticalSegmentIntersectsPolygon(px, topY, bottomY, obj.polygon)) return true;
      const p: Point = [px, bottomY];
      if (pointInPolygon(p, obj.polygon)) return true;
    }
  }
  return false;
}

export function updatePlayerMovement(deltaMs: number) {
  if (!GameState.localPlayerId) return;
  const player = GameState.players.get(GameState.localPlayerId) as Player | undefined;
  if (!player) return;

  const dtSec = deltaMs / 1000;
  let dirX = 0;
  if (Input.d) dirX += 1;
  if (Input.q) dirX -= 1;

  applyHorizontal(player, dirX);
  applyGravity(player, dtSec);

  const pos = integrate(player, dtSec);
  const clamped = clampToMap(pos.x, pos.y);

  player.onGround = false;
  const resolved = resolveWorldCollisions(clamped.x, clamped.y, player.radius, player.vy);
  const fx = resolved.x;
  const fy = resolved.y;
  if (resolved.landed) {
    player.vy = 0;
    player.onGround = true;
  }
  if (resolved.hitCeil && player.vy > 0) player.vy = 0;

  // World floor/ceiling as solid surfaces
  if (fy <= PLAYER_RADIUS + 1e-3 && player.vy <= 0) {
    player.vy = 0;
    player.onGround = true;
  }
  if (fy >= MAP_HEIGHT - PLAYER_RADIUS - 1e-3 && player.vy > 0) {
    player.vy = 0;
  }

  if (!player.onGround && player.vy <= 0 && hasGroundSupport(fx, fy)) {
    player.vy = 0;
    player.onGround = true;
  }

  processJump(player, deltaMs);

  player.x = fx;
  player.y = fy;
}


