import type { AttackDirection } from '@garama/shared';

type SlashParams = {
  ctx: CanvasRenderingContext2D;
  originX: number;
  originY: number;
  radius: number;
  dir: AttackDirection;
  msLeft: number;
  variant?: 'normal' | 'charged';
  durationMs?: number;
  bladeLength?: number;
  bladeBaseWidth?: number;
  bladeTipWidth?: number;
};

const DEFAULT_DURATION_MS = 140;
const directionRotation: Record<AttackDirection, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

// Renders a sword slash that swings 90 degrees from up toward a forward/down finish.
export function renderSlashVfx({
  ctx,
  originX,
  originY,
  radius,
  dir,
  msLeft,
  variant = 'normal',
  durationMs = DEFAULT_DURATION_MS,
  bladeLength = 70,
  bladeBaseWidth = 18,
  bladeTipWidth = 4,
}: SlashParams) {
  const timeRatio = Math.max(0, Math.min(1, msLeft / durationMs));
  if (timeRatio <= 0) return;

  const progress = 1 - timeRatio;
  const rotationOffset = directionRotation[dir] ?? 0;
  const startAngle = -Math.PI / 2 + rotationOffset;
  const endAngle = startAngle + Math.PI / 2;

  const getRotationForProgress = (progressValue: number) => {
    return startAngle + (endAngle - startAngle) * progressValue;
  };

  const rotation = getRotationForProgress(progress);
  const pivotX = originX + Math.cos(rotationOffset) * radius;
  const pivotY = originY + Math.sin(rotationOffset) * radius;

  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(rotation);
  ctx.globalAlpha = 0.4 + 0.6 * (1 - progress);

  const gradient = ctx.createLinearGradient(0, 0, bladeLength, 0);
  if (variant === 'charged') {
    gradient.addColorStop(0, '#7f1d1d');
    gradient.addColorStop(0.3, '#ef4444');
    gradient.addColorStop(1, '#fecaca');
  } else {
    gradient.addColorStop(0, '#cbd5e1');
    gradient.addColorStop(0.3, '#e2e8f0');
    gradient.addColorStop(1, '#94a3b8');
  }

  const halfBase = bladeBaseWidth / 2;
  const halfTip = Math.max(1, bladeTipWidth / 2);

  ctx.fillStyle = gradient;
  ctx.strokeStyle = variant === 'charged' ? '#450a0a' : '#475569';
  ctx.lineWidth = variant === 'charged' ? 4 : 2;

  ctx.beginPath();
  ctx.moveTo(0, -halfBase);
  ctx.lineTo(bladeLength * 0.85, -halfTip);
  ctx.lineTo(bladeLength, 0);
  ctx.lineTo(bladeLength * 0.85, halfTip);
  ctx.lineTo(0, halfBase);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();
  ctx.restore();
}