"use client";
import { useEffect, useRef } from 'react';
import useGameSocket from '../hooks/useGameSocket';
import useGameState from '../hooks/useGameState';
import useGameRenderer from '../hooks/useGameRenderer';

type Props = {
  playerName: string;
};

export default function GameSimple({ playerName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { players, myId, status, lastError, sendDirection } = useGameSocket(playerName);
  const { me, all } = useGameState(players, myId);

  useGameRenderer(canvasRef, { players: all, myId });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default only for game keys
      const key = event.key.toLowerCase();

      // Ignore if typing in an input
      if (document.activeElement?.tagName === 'INPUT') return;

      let direction: 'up' | 'down' | 'left' | 'right' | null = null;

      switch (key) {
        case 'w':
        case 'arrowup':
          direction = 'up';
          break;
        case 's':
        case 'arrowdown':
          direction = 'down';
          break;
        case 'a':
        case 'arrowleft':
          direction = 'left';
          break;
        case 'd':
        case 'arrowright':
          direction = 'right';
          break;
        default:
          return; // Not a movement key
      }

      event.preventDefault();
      sendDirection(direction);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // If releasing a movement key, send stop
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        sendDirection('stop');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [sendDirection]);

  return (
    <div className="relative w-full max-w-[960px]">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
        <span>Player: <strong>{playerName}</strong></span>
        <span>Status: {status}</span>
        <span>ID: {myId ?? '—'}</span>
        <span>Players: {all.length}</span>
      </div>

      <div className="relative rounded-lg border border-slate-700 bg-slate-900">
        <canvas ref={canvasRef} className="block h-[600px] w-full rounded-lg" />

        {status !== 'open' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/80 text-slate-200">
            <div className="text-center">
              <p className="text-lg font-semibold">Connecting to game server…</p>
              <p className="text-sm text-slate-300">Status: {status}</p>
              {lastError && <p className="mt-2 text-xs text-red-300">{lastError}</p>}
            </div>
          </div>
        )}
      </div>

      {me && (
        <div className="mt-3 text-sm text-slate-300">
          <p>Position: x={me.x.toFixed(1)} y={me.y.toFixed(1)}</p>
        </div>
      )}
    </div>
  );
}
