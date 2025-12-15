'use client';
import { useEffect, useRef } from 'react';

import { GameState } from '../game/gameState';

const DEFAULT_SIZE_PX = 180;
const DEFAULT_WORLD_RADIUS = 1200;

type Props = {
  sizePx?: number;
  worldRadius?: number;
  className?: string;
};

export default function MiniMap({
  sizePx = DEFAULT_SIZE_PX,
  worldRadius = DEFAULT_WORLD_RADIUS,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const frame = () => {
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(sizePx * dpr);
      const targetH = Math.round(sizePx * dpr);

      if (canvas.width !== targetW) canvas.width = targetW;
      if (canvas.height !== targetH) canvas.height = targetH;
      canvas.style.width = `${sizePx}px`;
      canvas.style.height = `${sizePx}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = sizePx / 2;
      const cy = sizePx / 2;
      const padding = 6;
      const innerSize = sizePx - padding * 2;
      const half = innerSize / 2;
      const left = padding;
      const top = padding;
      const right = sizePx - padding;
      const bottom = sizePx - padding;

      ctx.clearRect(0, 0, sizePx, sizePx);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, sizePx, sizePx);

      ctx.save();
      ctx.beginPath();
      ctx.rect(left, top, innerSize, innerSize);
      ctx.clip();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(left, top, innerSize, innerSize);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx, bottom);
      ctx.moveTo(left, cy);
      ctx.lineTo(right, cy);
      ctx.stroke();

      const localPlayerId = GameState.localPlayerId;
      const localPlayer = localPlayerId ? GameState.players.get(localPlayerId) : null;

      if (localPlayer && !localPlayer.isDead) {
        const scale = half / worldRadius;

        GameState.players.forEach((player) => {
          if (player.isDead) return;
          if (player.id === localPlayer.id) return;

          const dx = player.x - localPlayer.x;
          const dy = player.y - localPlayer.y;
          if (dx * dx + dy * dy > worldRadius * worldRadius) return;

          const x = cx + dx * scale;
          const y = cy - dy * scale;

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No signal', cx, cy);
      }

      ctx.restore();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, innerSize, innerSize);

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [sizePx, worldRadius]);

  return <canvas ref={canvasRef} className={`border border-slate-700 shadow-lg ${className}`} />;
}


