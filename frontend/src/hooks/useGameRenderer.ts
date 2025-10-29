"use client";
import { RefObject, useEffect, useRef } from 'react';
import type { PlayerSnapshot } from '../game/types';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../game/constants';

export type RendererOptions = {
  players: PlayerSnapshot[];
  myId: string | null;
};

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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple canvas setup
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationId: number;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const { width: canvasWidth, height: canvasHeight } = canvas;

      // Clear canvas
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Calculate scaling to fit world in canvas
      const scale = Math.min(canvasWidth / WORLD_WIDTH, canvasHeight / WORLD_HEIGHT);
      const offsetX = (canvasWidth - WORLD_WIDTH * scale) / 2;
      const offsetY = (canvasHeight - WORLD_HEIGHT * scale) / 2;

      // Draw world border
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(offsetX, offsetY, WORLD_WIDTH * scale, WORLD_HEIGHT * scale);

      // Draw players
      const currentPlayers = playersRef.current;
      const selfId = myIdRef.current;

      for (const player of currentPlayers) {
        const isSelf = player.id === selfId;
        const px = offsetX + player.x * scale;
        const py = offsetY + player.y * scale;
        const radius = isSelf ? 12 : 8;

        // Draw player circle
        ctx.beginPath();
        ctx.fillStyle = player.color ?? '#ffffff';
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw player name
        ctx.fillStyle = isSelf ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)';
        ctx.font = isSelf ? 'bold 14px sans-serif' : '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.name ?? player.id, px + radius + 6, py);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [canvasRef]);
}
