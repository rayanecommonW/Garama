"use client";
import { RefObject, useEffect, useRef } from 'react';
import type { PlayerSnapshot } from '../game/types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../game/constants';

export type RendererOptions = {
  players: PlayerSnapshot[];
  myId: string | null;
};

type ExtendedRenderingContext2D = CanvasRenderingContext2D & { dispose?: () => void; __garamaPixelRatio?: number };

function configureCanvas(canvas: HTMLCanvasElement): ExtendedRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) return null;

  const resize = () => {
    const pixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * pixelRatio;
    canvas.height = rect.height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    (context as ExtendedRenderingContext2D).__garamaPixelRatio = pixelRatio;
  };

  resize();
  window.addEventListener('resize', resize);

  return Object.assign(context, {
    dispose: () => window.removeEventListener('resize', resize),
  });
}

export default function useGameRenderer(canvasRef: RefObject<HTMLCanvasElement | null>, { players, myId }: RendererOptions) {
  const playersRef = useRef<PlayerSnapshot[]>(players);
  const myIdRef = useRef<string | null>(myId);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = configureCanvas(canvas);
    if (!ctx) return;

    let frameId: number;
    let running = true;

    const render = () => {
      if (!running) return;

      const pixelRatio = ctx.__garamaPixelRatio ?? window.devicePixelRatio ?? 1;
      const cssWidth = canvas.width / pixelRatio;
      const cssHeight = canvas.height / pixelRatio;

      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      const scale = Math.min(cssWidth / WORLD_WIDTH, cssHeight / WORLD_HEIGHT);
      const offsetX = (cssWidth - WORLD_WIDTH * scale) / 2;
      const offsetY = (cssHeight - WORLD_HEIGHT * scale) / 2;

      const currentPlayers = playersRef.current;
      const selfId = myIdRef.current;

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = Math.max(1.5 * scale, 1);
      ctx.strokeRect(offsetX, offsetY, WORLD_WIDTH * scale, WORLD_HEIGHT * scale);

      for (const player of currentPlayers) {
        const isSelf = player.id === selfId;

        const px = offsetX + player.x * scale;
        const py = offsetY + player.y * scale;
        const baseRadius = isSelf ? 14 : 10;
        const radius = Math.max(baseRadius * scale, 6);

        ctx.beginPath();
        ctx.fillStyle = player.color ?? '#ffffff';
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isSelf ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)';
        ctx.font = isSelf ? 'bold 14px sans-serif' : '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.name ?? player.id, px + radius + 6, py);
      }

      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      ctx.dispose?.();
    };
  }, [canvasRef]);
}
