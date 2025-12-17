import {
  CHARGED_HITBOX_SCALE,
  CHARGED_VFX_SCALE,
  CHARGE_HOLD_MS,
  MAP_GRID_CELL_SIZE,
  MAP_GRID_DOT_SIZE,
  MAP_GRID_COLOR,
  MAP_OUTSIDE_COLOR,
  MAP_WIDTH,
  MAP_HEIGHT,
  PLAYER_Z_INDEX,
  PLAYER_MAX_HEALTH,
} from '@garama/shared';

import { CHAT_BUBBLE_FLOAT_PX, CHAT_BUBBLE_HOLD_MS, CHAT_BUBBLE_LIFE_MS } from './chatBubbles';
import { renderDashTrail } from './dashRenderer';
import { renderDebugHitboxes, renderFreeCamIndicator, renderMouseCoordinates } from './debugRenderer';
import { renderSlashVfx } from './slashRenderer';
import { renderSprintDust } from './sprintDust';

import type { GameStateType, RenderableObject } from './gameState';
import type { Point } from '@garama/shared';

let backgroundNoisePattern: CanvasPattern | null = null;

function getBackgroundNoisePattern(ctx: CanvasRenderingContext2D) {
  if (backgroundNoisePattern) return backgroundNoisePattern;

  const tileSize = 96;
  const tile = document.createElement('canvas');
  tile.width = tileSize;
  tile.height = tileSize;

  const tctx = tile.getContext('2d');
  if (!tctx) return null;

  tctx.clearRect(0, 0, tileSize, tileSize);
  tctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  for (let i = 0; i < 220; i++) {
    const x = Math.floor(Math.random() * tileSize);
    const y = Math.floor(Math.random() * tileSize);
    const r = Math.random() < 0.85 ? 1 : 2;
    tctx.beginPath();
    tctx.arc(x, y, r, 0, Math.PI * 2);
    tctx.fill();
  }

  // Slight diagonal streaks for depth.
  tctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  tctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const x0 = Math.random() * tileSize;
    const y0 = Math.random() * tileSize;
    tctx.beginPath();
    tctx.moveTo(x0, y0);
    tctx.lineTo(x0 + 24, y0 - 18);
    tctx.stroke();
  }

  backgroundNoisePattern = ctx.createPattern(tile, 'repeat');
  return backgroundNoisePattern;
}

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function estimateServerNowMs(clientNowMs: number, gameState: GameStateType) {
  if (gameState.net.smoothedRttMs > 0) {
    return clientNowMs + gameState.net.clockOffsetMs;
  }
  if (gameState.net.lastSnapshotServerTime === null || gameState.net.lastSnapshotClientRecvMs === null) {
    return null;
  }
  return gameState.net.lastSnapshotServerTime + (clientNowMs - gameState.net.lastSnapshotClientRecvMs);
}

export function renderFrame(canvas: HTMLCanvasElement, gameState: GameStateType) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const nowMs = performance.now();

  const viewportWidth = canvas.width;
  const viewportHeight = canvas.height;

  gameState.viewportWidth = viewportWidth;
  gameState.viewportHeight = viewportHeight;

  const zoom = gameState.freeCamMode ? gameState.freeCamZoom : 1;
  const effectiveWidth = viewportWidth / zoom;
  const effectiveHeight = viewportHeight / zoom;

  const cameraLeft = gameState.camera.x - effectiveWidth / 2;
  const cameraTop = gameState.camera.y - effectiveHeight / 2;
  const cameraRight = cameraLeft + effectiveWidth;
  const cameraBottom = cameraTop + effectiveHeight;

  ctx.fillStyle = MAP_OUTSIDE_COLOR;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  ctx.save();
  ctx.scale(zoom, zoom);

  renderMapBackground(ctx, cameraLeft, cameraTop, effectiveWidth, effectiveHeight);
  renderMapBorders(ctx, cameraLeft, cameraTop, effectiveWidth, effectiveHeight);
  if (gameState.debugCollisions) {
    renderGrid(ctx, cameraLeft, cameraTop, cameraRight, cameraBottom, effectiveWidth, effectiveHeight);
  }

  const backgroundObjects = gameState.objects.filter((obj) => obj.zIndex < PLAYER_Z_INDEX);
  const foregroundObjects = gameState.objects.filter((obj) => obj.zIndex >= PLAYER_Z_INDEX);

  backgroundObjects.sort((a, b) => a.zIndex - b.zIndex);
  foregroundObjects.sort((a, b) => a.zIndex - b.zIndex);

  renderObjectsList(ctx, backgroundObjects, cameraLeft, cameraTop, effectiveWidth, effectiveHeight, cameraRight, cameraBottom);
  renderSprintDust(ctx, cameraLeft, cameraTop, effectiveHeight);
  renderPlayers(ctx, gameState, cameraLeft, cameraTop, effectiveHeight, nowMs);
  renderObjectsList(ctx, foregroundObjects, cameraLeft, cameraTop, effectiveWidth, effectiveHeight, cameraRight, cameraBottom);

  if (gameState.debugCollisions) {
    renderDebugHitboxes(ctx, gameState, cameraLeft, cameraTop, effectiveHeight);
  }

  ctx.restore();

  if (gameState.showCoordinates) {
    renderMouseCoordinates(ctx, gameState);
  }

  if (gameState.freeCamMode) {
    renderFreeCamIndicator(ctx, viewportWidth, gameState.freeCamZoom);
  }
}

function renderMapBackground(
  ctx: CanvasRenderingContext2D,
  cameraLeft: number,
  cameraTop: number,
  viewportWidth: number,
  viewportHeight: number
) {
  const worldLeft = 0 - cameraLeft;
  const worldTop = viewportHeight - (MAP_HEIGHT - cameraTop);
  const worldRight = MAP_WIDTH - cameraLeft;
  const worldBottom = viewportHeight - (0 - cameraTop);

  const visibleWorldLeft = Math.max(0, worldLeft);
  const visibleWorldTop = Math.max(0, worldTop);
  const visibleWorldRight = Math.min(viewportWidth, worldRight);
  const visibleWorldBottom = Math.min(viewportHeight, worldBottom);

  if (visibleWorldRight <= visibleWorldLeft || visibleWorldBottom <= visibleWorldTop) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(
    visibleWorldLeft,
    visibleWorldTop,
    visibleWorldRight - visibleWorldLeft,
    visibleWorldBottom - visibleWorldTop
  );
  ctx.clip();

  renderForestRuinsParallax(ctx, cameraLeft, cameraTop, viewportWidth, viewportHeight);

  ctx.restore();
}

function renderForestRuinsParallax(
  ctx: CanvasRenderingContext2D,
  cameraLeft: number,
  cameraTop: number,
  viewportWidth: number,
  viewportHeight: number
) {
  // Base sky/canopy gradient.
  const sky = ctx.createLinearGradient(0, 0, 0, viewportHeight);
  sky.addColorStop(0, '#0b2418');
  sky.addColorStop(0.45, '#06140d');
  sky.addColorStop(1, '#040906');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  // Distant haze.
  const haze = ctx.createLinearGradient(0, 0, 0, viewportHeight * 0.8);
  haze.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
  haze.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight * 0.8);

  // Parallax layers (far -> near).
  const farX = -cameraLeft * 0.06;
  const farY = cameraTop * 0.02;
  renderSilhouetteWave(ctx, {
    xOffset: farX,
    yBase: viewportHeight * 0.28 + farY,
    amp: 26,
    freq: 0.0022,
    step: 220,
    viewportWidth,
    viewportHeight,
    fillStyle: 'rgba(10, 41, 27, 0.95)',
  });

  const midX = -cameraLeft * 0.12;
  const midY = cameraTop * 0.045;
  renderSilhouetteWave(ctx, {
    xOffset: midX,
    yBase: viewportHeight * 0.36 + midY,
    amp: 34,
    freq: 0.0045,
    step: 160,
    viewportWidth,
    viewportHeight,
    fillStyle: 'rgba(7, 30, 19, 0.95)',
  });

  const treeX = -cameraLeft * 0.18;
  const treeY = cameraTop * 0.065;
  renderTreeLine(ctx, {
    xOffset: treeX,
    yBase: viewportHeight * 0.44 + treeY,
    viewportWidth,
    viewportHeight,
  });

  // Near fog layer for depth and motion.
  const fogX = -cameraLeft * 0.26;
  const fogY = cameraTop * 0.09;
  renderFogBands(ctx, {
    xOffset: fogX,
    yOffset: fogY,
    viewportWidth,
    viewportHeight,
  });

  // Subtle texture overlay (cached).
  const noise = getBackgroundNoisePattern(ctx);
  if (noise) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = noise;
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    ctx.restore();
  }

  // Vignette to keep focus on characters/platforms.
  const vignette = ctx.createRadialGradient(
    viewportWidth / 2,
    viewportHeight * 0.55,
    viewportHeight * 0.2,
    viewportWidth / 2,
    viewportHeight * 0.55,
    viewportHeight * 0.95
  );
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);
}

function renderSilhouetteWave(
  ctx: CanvasRenderingContext2D,
  opts: {
    xOffset: number;
    yBase: number;
    amp: number;
    freq: number;
    step: number;
    viewportWidth: number;
    viewportHeight: number;
    fillStyle: string;
  }
) {
  const { xOffset, yBase, amp, freq, step, viewportWidth, viewportHeight, fillStyle } = opts;

  const startX = -step * 2;
  const endX = viewportWidth + step * 2;

  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo(startX, viewportHeight + 200);
  ctx.lineTo(startX, yBase);

  for (let x = startX; x <= endX; x += step) {
    const wx = x - xOffset;
    const wobble = Math.sin(wx * freq) * amp + Math.sin(wx * freq * 0.55) * (amp * 0.35);
    ctx.lineTo(x, yBase + wobble);
  }

  ctx.lineTo(endX, viewportHeight + 200);
  ctx.closePath();
  ctx.fill();
}

function renderTreeLine(
  ctx: CanvasRenderingContext2D,
  opts: { xOffset: number; yBase: number; viewportWidth: number; viewportHeight: number }
) {
  const { xOffset, yBase, viewportWidth, viewportHeight } = opts;
  const step = 90;
  const startX = -step * 4;
  const endX = viewportWidth + step * 4;

  ctx.fillStyle = 'rgba(4, 20, 12, 0.98)';
  ctx.beginPath();
  ctx.moveTo(startX, viewportHeight + 240);
  ctx.lineTo(startX, yBase);

  for (let x = startX; x <= endX; x += step) {
    const wx = x - xOffset;
    const height = 40 + (Math.sin(wx * 0.015) + 1) * 55 + (Math.sin(wx * 0.05) + 1) * 10;
    const spike = (Math.sin(wx * 0.09) + 1) * 12;
    ctx.lineTo(x + step * 0.35, yBase - height - spike);
    ctx.lineTo(x + step * 0.7, yBase - height * 0.72);
    ctx.lineTo(x + step, yBase - height * 0.92);
  }

  ctx.lineTo(endX, viewportHeight + 240);
  ctx.closePath();
  ctx.fill();
}

function renderFogBands(
  ctx: CanvasRenderingContext2D,
  opts: { xOffset: number; yOffset: number; viewportWidth: number; viewportHeight: number }
) {
  const { xOffset, yOffset, viewportWidth, viewportHeight } = opts;
  const bandH = 160;
  const bands = 4;

  ctx.save();
  ctx.globalAlpha = 0.28;

  for (let i = 0; i < bands; i++) {
    const y = viewportHeight * 0.55 + i * (bandH * 0.62) + yOffset * 0.25;
    const grad = ctx.createLinearGradient(0, y, 0, y + bandH);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.5, 'rgba(231, 253, 245, 0.14)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;

    const x = (xOffset * 0.4 + i * 120) % 260;
    ctx.fillRect(-260 + x, y, viewportWidth + 520, bandH);
  }

  ctx.restore();
}

function renderMapBorders(
  ctx: CanvasRenderingContext2D,
  cameraLeft: number,
  cameraTop: number,
  viewportWidth: number,
  viewportHeight: number
) {
  const worldLeft = 0 - cameraLeft;
  const worldTop = viewportHeight - (MAP_HEIGHT - cameraTop);
  const worldRight = MAP_WIDTH - cameraLeft;
  const worldBottom = viewportHeight - (0 - cameraTop);

  const outerStroke = '#0b1a12';
  const midStroke = '#1f3b2b';
  const innerStroke = 'rgba(255, 255, 255, 0.08)';

  if (worldLeft >= 0 && worldLeft <= viewportWidth) {
    const visibleTop = Math.max(0, worldTop);
    const visibleBottom = Math.min(viewportHeight, worldBottom);
    if (visibleBottom > visibleTop) {
      renderBorderEdge(ctx, [worldLeft, visibleTop], [worldLeft, visibleBottom], {
        outerStroke,
        midStroke,
        innerStroke,
      });
    }
  }

  if (worldRight >= 0 && worldRight <= viewportWidth) {
    const visibleTop = Math.max(0, worldTop);
    const visibleBottom = Math.min(viewportHeight, worldBottom);
    if (visibleBottom > visibleTop) {
      renderBorderEdge(ctx, [worldRight, visibleTop], [worldRight, visibleBottom], {
        outerStroke,
        midStroke,
        innerStroke,
      });
    }
  }

  if (worldTop >= 0 && worldTop <= viewportHeight) {
    const visibleLeft = Math.max(0, worldLeft);
    const visibleRight = Math.min(viewportWidth, worldRight);
    if (visibleRight > visibleLeft) {
      renderBorderEdge(ctx, [visibleLeft, worldTop], [visibleRight, worldTop], {
        outerStroke,
        midStroke,
        innerStroke,
      });
    }
  }

  if (worldBottom >= 0 && worldBottom <= viewportHeight) {
    const visibleLeft = Math.max(0, worldLeft);
    const visibleRight = Math.min(viewportWidth, worldRight);
    if (visibleRight > visibleLeft) {
      renderBorderEdge(ctx, [visibleLeft, worldBottom], [visibleRight, worldBottom], {
        outerStroke,
        midStroke,
        innerStroke,
      });
    }
  }
}

function renderBorderEdge(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  palette: { outerStroke: string; midStroke: string; innerStroke: string }
) {
  // Outer shadow stroke.
  ctx.strokeStyle = palette.outerStroke;
  ctx.lineWidth = 10;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  ctx.lineTo(end[0], end[1]);
  ctx.stroke();

  // Main mossy stroke.
  ctx.strokeStyle = palette.midStroke;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  ctx.lineTo(end[0], end[1]);
  ctx.stroke();

  // Inner highlight.
  ctx.strokeStyle = palette.innerStroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(start[0], start[1]);
  ctx.lineTo(end[0], end[1]);
  ctx.stroke();

  // Vines/roots accents (deterministic sine wiggles).
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len <= 0) return;

  const nx = -dy / len;
  const ny = dx / len;
  const step = 220;
  const count = Math.floor(len / step);
  if (count <= 0) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.22)';
  ctx.lineWidth = 1.5;

  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const bx = start[0] + dx * t;
    const by = start[1] + dy * t;
    const swing = Math.sin((bx + by) * 0.02) * 10;
    const ox = nx * swing;
    const oy = ny * swing;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + ox, by + oy, bx + ox * 0.2, by + oy * 0.2);
    ctx.stroke();
  }

  ctx.restore();
}

function renderGrid(
  ctx: CanvasRenderingContext2D,
  cameraLeft: number,
  cameraTop: number,
  cameraRight: number,
  cameraBottom: number,
  viewportWidth: number,
  viewportHeight: number
) {
  ctx.fillStyle = MAP_GRID_COLOR;

  const startGridX = Math.max(0, Math.floor(cameraLeft / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE);
  const endGridX = Math.min(MAP_WIDTH, Math.ceil(cameraRight / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE);
  const startGridY = Math.max(0, Math.floor(cameraTop / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE);
  const endGridY = Math.min(MAP_HEIGHT, Math.ceil(cameraBottom / MAP_GRID_CELL_SIZE) * MAP_GRID_CELL_SIZE);

  for (let x = startGridX; x <= endGridX; x += MAP_GRID_CELL_SIZE) {
    for (let y = startGridY; y <= endGridY; y += MAP_GRID_CELL_SIZE) {
      const screenX = x - cameraLeft;
      const screenY = viewportHeight - (y - cameraTop);

      if (screenX >= 0 && screenX <= viewportWidth && screenY >= 0 && screenY <= viewportHeight) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, MAP_GRID_DOT_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function renderObjectsList(
  ctx: CanvasRenderingContext2D,
  objects: RenderableObject[],
  cameraLeft: number,
  cameraTop: number,
  viewportWidth: number,
  viewportHeight: number,
  cameraRight: number,
  cameraBottom: number
) {
  objects.forEach((obj: RenderableObject) => {
    const isVisible =
      obj.boundingBox.maxX >= cameraLeft &&
      obj.boundingBox.minX <= cameraRight &&
      obj.boundingBox.maxY >= cameraTop &&
      obj.boundingBox.minY <= cameraBottom;

    if (!isVisible) return;

    const screenPolygon: Point[] = obj.polygon.map(([x, y]: Point) => {
      const screenX = x - cameraLeft;
      const screenY = viewportHeight - (y - cameraTop);
      return [screenX, screenY] as Point;
    });

    ctx.save();
    switch (obj.renderStyle) {
      case 'stone-wall':
        renderStoneWall(ctx, screenPolygon);
        break;
      case 'wooden-barrier':
        renderWoodenBarrier(ctx, screenPolygon);
        break;
      case 'metal':
        renderMetal(ctx, screenPolygon);
        break;
      case 'spikes':
        renderSpikes(ctx, screenPolygon);
        break;
    }
    ctx.restore();
  });
}

function renderPlayers(
  ctx: CanvasRenderingContext2D,
  gameState: GameStateType,
  cameraLeft: number,
  cameraTop: number,
  viewportHeight: number,
  nowMs: number
) {
  const estimatedServerNow = estimateServerNowMs(nowMs, gameState);
  const chargeParticleStartDelayMs = 250;

  gameState.players.forEach((player) => {
    const screenX = player.x - cameraLeft;
    const screenY = viewportHeight - (player.y - cameraTop);

    if (player.dashMsLeft > 0) {
      const dashDir = player.dashDir === 'left' ? 'left' : 'right';
      renderDashTrail(ctx, screenX, screenY, player.radius, dashDir, player.dashMsLeft);
    }

    const attackHoldStartedAtServerTime = player.attackHoldStartedAtServerTime ?? null;
    const hasChargeHold = attackHoldStartedAtServerTime !== null && !player.isDead;
    const holdMs =
      hasChargeHold && estimatedServerNow !== null ? Math.max(0, estimatedServerNow - attackHoldStartedAtServerTime) : 0;
    const chargeProgress = CHARGE_HOLD_MS > 0 ? clamp(0, holdMs / CHARGE_HOLD_MS, 1) : 0;

    if (hasChargeHold && !player.isCharging && holdMs >= chargeParticleStartDelayMs) {
      const seed = (player.id.charCodeAt(0) ?? 0) + (player.id.charCodeAt(player.id.length - 1) ?? 0);
      const particleProgress =
        CHARGE_HOLD_MS > chargeParticleStartDelayMs
          ? clamp(0, (holdMs - chargeParticleStartDelayMs) / (CHARGE_HOLD_MS - chargeParticleStartDelayMs), 1)
          : chargeProgress;
      const particleCount = Math.round(10 + 12 * particleProgress);
      const spin = nowMs / 350;
      const outerR = player.radius + 28;
      const innerR = player.radius + 6;
      const baseR = outerR - (outerR - innerR) * particleProgress;
      const fadeOut = clamp(0, (1 - particleProgress) / 0.12, 1);

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;

      for (let i = 0; i < particleCount; i++) {
        const a = (i / particleCount) * Math.PI * 2 + spin + seed * 0.01;
        const wobble = Math.sin(nowMs / 140 + i * 1.7 + seed) * 4;
        const r = baseR + wobble;
        const px = screenX + Math.cos(a) * r;
        const py = screenY + Math.sin(a) * r;

        const pulse = (Math.sin(nowMs / 120 + i * 2.3 + seed) + 1) / 2;
        const alpha = (0.08 + 0.22 * pulse) * fadeOut;
        if (alpha <= 0) continue;

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(px, py, 1.2 + pulse * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    if (player.isCharging && !player.isDead) {
      const seed = (player.id.charCodeAt(0) ?? 0) + (player.id.charCodeAt(player.id.length - 1) ?? 0);
      const rayCount = 12;
      const spin = nowMs / 900;
      const innerR = player.radius + 6;

      ctx.save();
      ctx.strokeStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20;

      for (let i = 0; i < rayCount; i++) {
        const a = (i / rayCount) * Math.PI * 2 + spin + seed * 0.01;
        const pulse = (Math.sin(nowMs / 160 + i * 1.9 + seed) + 1) / 2;
        const outerR = player.radius + 44 + pulse * 18;

        const x0 = screenX + Math.cos(a) * outerR;
        const y0 = screenY + Math.sin(a) * outerR;
        const x1 = screenX + Math.cos(a) * innerR;
        const y1 = screenY + Math.sin(a) * innerR;

        ctx.globalAlpha = 0.08 + 0.22 * pulse;
        ctx.lineWidth = 1 + 3 * pulse;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }

      const pulse = (Math.sin(nowMs / 120) + 1) / 2;
      const glowRadius = player.radius + 6 + pulse * 4;

      ctx.save();
      ctx.globalAlpha = 0.25 + pulse * 0.25;
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 18 + pulse * 10;
      ctx.beginPath();
      ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }

    const isFlashing = (player.hitFlashMs ?? 0) > 0;
    let fillColor = player.color;
    if (player.isDead) {
      fillColor = '#4b5563';
    } else if (isFlashing) {
      fillColor = '#ff4d4d';
    }
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(screenX, screenY, player.radius, 0, Math.PI * 2);
    ctx.fill();

    if (player.attackMsLeft && player.attackMsLeft > 0 && player.attackDir) {
      const variant = player.attackVariant === 'charged' ? 'charged' : 'normal';
      const vfxScale = variant === 'charged' ? CHARGED_VFX_SCALE : 1;
      const slashRadius = variant === 'charged' ? player.radius * CHARGED_HITBOX_SCALE : player.radius;
      const durationMs = variant === 'charged' ? 220 : 140;

      renderSlashVfx({
        ctx,
        originX: screenX,
        originY: screenY,
        radius: slashRadius,
        dir: player.attackDir,
        msLeft: player.attackMsLeft,
        variant,
        durationMs,
        bladeLength: 70 * vfxScale,
        bladeBaseWidth: 20 * vfxScale,
        bladeTipWidth: 6 * vfxScale,
      });
    }

    const barWidth = player.radius * 2;
    const hpRatio = Math.max(0, Math.min(1, (player.hp ?? PLAYER_MAX_HEALTH) / PLAYER_MAX_HEALTH));
    const barX = screenX - barWidth / 2;
    const barY = screenY - player.radius - 10;

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(barX, barY, barWidth, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(barX, barY, barWidth * hpRatio, 4);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const nameY = screenY - player.radius - 4;
    ctx.fillText(player.name, screenX, nameY);

    renderChatBubbles(ctx, gameState, player.id, screenX, nameY, nowMs);
  });
}

function renderChatBubbles(
  ctx: CanvasRenderingContext2D,
  gameState: GameStateType,
  playerId: string,
  screenX: number,
  nameBaselineY: number,
  nowMs: number
) {
  const chatState = gameState.chat.get(playerId);
  if (!chatState || chatState.visible.length === 0) return;

  const fontSizePx = 16;
  const lineHeightPx = 20;
  const paddingX = 8;
  const paddingY = 6;
  const bubbleGapPx = 4;

  // Position bubbles above the player's name.
  const baseY = nameBaselineY - 18;

  ctx.save();
  ctx.font = `${fontSizePx}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  // Draw newest bubble closest to the player, older ones above it.
  for (let i = chatState.visible.length - 1; i >= 0; i--) {
    const bubble = chatState.visible[i];
    if (!bubble) continue;

    const stackIndex = chatState.visible.length - 1 - i;
    const ageMs = nowMs - bubble.shownAtMs;
    const moveDurationMs = Math.max(1, CHAT_BUBBLE_LIFE_MS - CHAT_BUBBLE_HOLD_MS);
    const moveAgeMs = Math.max(0, ageMs - CHAT_BUBBLE_HOLD_MS);
    const t = clamp(0, moveAgeMs / moveDurationMs, 1);
    const alpha = ageMs < CHAT_BUBBLE_HOLD_MS ? 1 : 1 - t;
    if (alpha <= 0) continue;

    const floatUpPx = ageMs < CHAT_BUBBLE_HOLD_MS ? 0 : CHAT_BUBBLE_FLOAT_PX * t;
    const y = baseY - stackIndex * (lineHeightPx + bubbleGapPx) - floatUpPx;

    const text = bubble.text;
    const textWidth = ctx.measureText(text).width;
    const w = textWidth + paddingX * 2;
    const h = lineHeightPx + paddingY;
    const rectX = screenX - w / 2;
    const rectY = y - lineHeightPx - paddingY;

    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = '#000000';
    ctx.fillRect(rectX, rectY, w, h);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, screenX, y);
  }

  ctx.restore();
}


function renderStoneWall(ctx: CanvasRenderingContext2D, polygon: Point[]) {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const base = ctx.createLinearGradient(minX, minY, maxX, maxY);
  base.addColorStop(0, '#4b5d52');
  base.addColorStop(0.55, '#36463d');
  base.addColorStop(1, '#1f2b26');

  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#0b1a12';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(231, 253, 245, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Stone blocks (subtle).
  ctx.strokeStyle = 'rgba(231, 253, 245, 0.06)';
  ctx.lineWidth = 1;

  for (let y = minY; y < maxY; y += 18) {
    ctx.beginPath();
    ctx.moveTo(minX, y);
    ctx.lineTo(maxX, y);
    ctx.stroke();
  }

  let offsetToggle = false;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
  for (let y = minY; y < maxY; y += 18) {
    const offset = offsetToggle ? 20 : 0;
    for (let x = minX + offset; x < maxX; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 18);
      ctx.stroke();
    }
    offsetToggle = !offsetToggle;
  }
}

function renderWoodenBarrier(ctx: CanvasRenderingContext2D, polygon: Point[]) {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const wood = ctx.createLinearGradient(minX, minY, minX, maxY);
  wood.addColorStop(0, '#6f4a2c');
  wood.addColorStop(1, '#3a2414');

  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#0b1a12';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(231, 253, 245, 0.06)';
  ctx.lineWidth = 2;

  // Planks.
  for (let x = minX; x < maxX; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, minY);
    ctx.lineTo(x, maxY);
    ctx.stroke();
  }

  const midY = (minY + maxY) / 2;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(minX, midY);
  ctx.lineTo(maxX, midY);
  ctx.stroke();
}

function renderMetal(ctx: CanvasRenderingContext2D, polygon: Point[]) {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const gradient = ctx.createLinearGradient(minX, minY, maxX, maxY);
  gradient.addColorStop(0, '#5b7a6f');
  gradient.addColorStop(0.45, '#b6c7bf');
  gradient.addColorStop(1, '#2a3b35');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(polygon[0][0], polygon[0][1]);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i][0], polygon[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#0b1a12';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#12211b';
  polygon.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function renderSpikes(ctx: CanvasRenderingContext2D, polygon: Point[]) {
  const xs = polygon.map((p) => p[0]);
  const ys = polygon.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const w = maxX - minX;
  const h = maxY - minY;
  if (w <= 0 || h <= 0) return;

  // Backplate to keep spikes readable on any background.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(minX, minY, w, h);

  const spikeGrad = ctx.createLinearGradient(minX, minY, minX, maxY);
  spikeGrad.addColorStop(0, '#fb7185');
  spikeGrad.addColorStop(0.6, '#7f1d1d');
  spikeGrad.addColorStop(1, '#1f0a0f');

  const spikeBaseY = maxY;
  const spikeTipY = minY + Math.max(2, h * 0.1);

  const desiredSpikeW = 22;
  const spikeCount = Math.max(1, Math.floor(w / desiredSpikeW));
  const spikeW = w / spikeCount;

  ctx.fillStyle = spikeGrad;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.lineWidth = 2;

  for (let i = 0; i < spikeCount; i++) {
    const x0 = minX + i * spikeW;
    const x1 = x0 + spikeW;
    const xm = (x0 + x1) / 2;

    ctx.beginPath();
    ctx.moveTo(x0, spikeBaseY);
    ctx.lineTo(xm, spikeTipY);
    ctx.lineTo(x1, spikeBaseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tiny highlight on the left edge.
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 + spikeW * 0.12, spikeBaseY - 1);
    ctx.lineTo(xm - spikeW * 0.06, spikeTipY + 1);
    ctx.stroke();
    ctx.restore();
  }
}
