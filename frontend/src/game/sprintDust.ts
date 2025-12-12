import { GameState } from './gameState';

type DustParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  msLeft: number;
  lifeMs: number;
};

const MAX_PARTICLES = 160;
const SPAWN_INTERVAL_MS = 45;

let spawnAccMs = 0;
const particles: DustParticle[] = [];

function spawnParticle(player: { x: number; y: number; vx: number; radius: number }) {
  const trailSign = player.vx >= 0 ? -1 : 1;

  const baseX = player.x + trailSign * (player.radius * 0.9);
  const baseY = player.y - player.radius + 1;

  const x = baseX + (Math.random() - 0.5) * player.radius * 0.6;
  const y = baseY + (Math.random() - 0.5) * 2;

  const vx = trailSign * (30 + Math.random() * 40);
  const vy = 90 + Math.random() * 120;

  const lifeMs = 220 + Math.random() * 160;
  const r = 2 + Math.random() * 3;

  particles.push({ x, y, vx, vy, r, msLeft: lifeMs, lifeMs });
  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }
}

/**
 * Updates and spawns sprint dust particles for the local player.
 */
export function updateSprintDust(deltaMs: number) {
  const dtSec = deltaMs / 1000;

  for (const p of particles) {
    p.msLeft -= deltaMs;
    p.x += p.vx * dtSec;
    p.y += p.vy * dtSec;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].msLeft > 0) continue;
    particles.splice(i, 1);
  }

  if (!GameState.localPlayerId) return;
  const player = GameState.players.get(GameState.localPlayerId);
  if (!player || player.isDead) return;

  const isMoving = Math.abs(player.vx) > 1;
  const canSpawn = player.isSprinting && player.onGround && isMoving;
  if (!canSpawn) {
    spawnAccMs = 0;
    return;
  }

  spawnAccMs += deltaMs;
  while (spawnAccMs >= SPAWN_INTERVAL_MS) {
    spawnAccMs -= SPAWN_INTERVAL_MS;
    spawnParticle(player);
  }
}

/**
 * Renders sprint dust particles (white circles drifting up) in world space.
 */
export function renderSprintDust(
  ctx: CanvasRenderingContext2D,
  cameraLeft: number,
  cameraTop: number,
  viewportHeight: number
) {
  if (particles.length === 0) return;

  ctx.save();
  ctx.fillStyle = '#ffffff';

  for (const p of particles) {
    const ratio = Math.max(0, Math.min(1, p.msLeft / p.lifeMs));
    const alpha = 0.5 * ratio;
    if (alpha <= 0) continue;

    const screenX = p.x - cameraLeft;
    const screenY = viewportHeight - (p.y - cameraTop);

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(screenX, screenY, p.r * (0.75 + (1 - ratio) * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}


