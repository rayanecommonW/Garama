"use client";
import { RefObject, useEffect, useRef } from 'react';
import type { PlayerSnapshot } from './useGameSocket';

export type RendererOptions = {
  players: PlayerSnapshot[];
  myId: string | null;
};

function configureCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) return null;

  const resize = () => {
    const pixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * pixelRatio;
    canvas.height = rect.height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
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

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentPlayers = playersRef.current;
      const selfId = myIdRef.current;

      for (const player of currentPlayers) {
        const isSelf = player.id === selfId;

        ctx.beginPath();
        ctx.fillStyle = player.color ?? '#ffffff';
        ctx.arc(player.x, player.y, isSelf ? 14 : 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isSelf ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)';
        ctx.font = isSelf ? 'bold 14px sans-serif' : '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.name ?? player.id, player.x + 16, player.y);
      }

      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      (ctx as any).dispose?.();
    };
  }, [canvasRef]);
}
