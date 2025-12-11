import { DASH_DURATION_MS, DASH_SPEED } from './dash';

import type { AttackDirection } from '@garama/shared';

const DASH_TRAIL_DURATION_MS = 240;
const DASH_TRAIL_LENGTH = DASH_SPEED * (DASH_DURATION_MS / 1000); // match dash distance scale

type DashDir = Extract<AttackDirection, 'left' | 'right'>;

/**
 * Renders a bright, fading dash wind trail behind the player.
 */
export function renderDashTrail(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  dashDir: DashDir,
  dashMsLeft: number
) {
  const ratio = Math.max(0, Math.min(1, dashMsLeft / DASH_TRAIL_DURATION_MS));
  if (ratio <= 0) return;

  const trailSign = dashDir === 'left' ? 1 : -1; // opposite of dash direction
  const lines = [1, 0.82, 0.68, 0.55, 0.42]; // length scales
  const baseOffset = DASH_TRAIL_LENGTH * 0.05;
  const offsetStep = DASH_TRAIL_LENGTH * 0.07;
  const verticalSpacing = 3.5;

  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';

  lines.forEach((scale, idx) => {
    const offset = baseOffset + offsetStep * idx;
    const lineLength = DASH_TRAIL_LENGTH * 0.4 * scale;
    const alpha = 0.75 * ratio * (1 - idx * 0.15);
    const yJitter = (idx - 2) * verticalSpacing;

    ctx.globalAlpha = alpha;
    ctx.lineWidth = 3 - idx * 0.4;

    const startX = centerX + trailSign * (offset * 0.6);
    const endX = centerX + trailSign * (offset + lineLength);

    ctx.beginPath();
    ctx.moveTo(startX, centerY + yJitter);
    ctx.lineTo(endX, centerY + yJitter);
    ctx.stroke();
  });

  ctx.restore();
}
