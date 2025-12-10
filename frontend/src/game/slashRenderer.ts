import type { AttackDirection } from '@garama/shared';

type SlashParams = {
  ctx: CanvasRenderingContext2D;
  originX: number;
  originY: number;
  radius: number;
  dir: AttackDirection;
  msLeft: number;
  hitbox: { reach: number; height: number };
};

export function renderSlashVfx({
  ctx,
  originX,
  originY,
  radius,
  dir,
  msLeft,
  hitbox,
}: SlashParams) {
  const duration = 140;
  const clamped = Math.max(0, Math.min(1, msLeft / duration));
  if (clamped <= 0) return;

  const reach = hitbox.reach;
  const height = hitbox.height;

  let centerX = originX + radius + reach / 2;
  let centerY = originY;

  if (dir === 'left') {
    centerX = originX - radius - reach / 2;
    centerY = originY;
  } else if (dir === 'up') {
    centerX = originX;
    centerY = originY - radius - height / 2;
  } else if (dir === 'down') {
    centerX = originX;
    centerY = originY + radius + height / 2;
  }

  const rx = reach / 2;
  const ry = height / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#cbd5e1';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(-rx, -ry, reach, height);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

