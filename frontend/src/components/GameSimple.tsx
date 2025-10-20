"use client";
import { useEffect, useMemo, useRef } from 'react';
import useGameSocket from '../hooks/useGameSocket';
import useGameState from '../hooks/useGameState';
import useGameRenderer from '../hooks/useGameRenderer';

type Props = {
  playerName: string;
};

type Direction = 'up' | 'down' | 'left' | 'right' | 'stop';

const MOVEMENT_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']);

function computeDirection(keys: Set<string>): Direction {
  if (keys.has('w') || keys.has('arrowup')) return 'up';
  if (keys.has('s') || keys.has('arrowdown')) return 'down';
  if (keys.has('a') || keys.has('arrowleft')) return 'left';
  if (keys.has('d') || keys.has('arrowright')) return 'right';
  return 'stop';
}

export default function GameSimple({ playerName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { players, myId, status, lastError, sendDirection } = useGameSocket(playerName);
  const { me, others, all } = useGameState(players, myId);

  useGameRenderer(canvasRef, { players: all, myId });

  useEffect(() => {
    const pressed = new Set<string>();
    let lastDirection: Direction = 'stop';

    const updateDirection = () => {
      const direction = computeDirection(pressed);
      if (direction !== lastDirection) {
        sendDirection(direction);
        lastDirection = direction;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!MOVEMENT_KEYS.has(key)) return;
      if (document.activeElement && (document.activeElement as HTMLElement).tagName === 'INPUT') return;
      event.preventDefault();
      pressed.add(key);
      updateDirection();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!MOVEMENT_KEYS.has(key)) return;
      event.preventDefault();
      pressed.delete(key);
      updateDirection();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      sendDirection('stop');
    };
  }, [sendDirection]);

  const info = useMemo(() => ({
    status,
    playerName,
    id: myId ?? '—',
    players: all.length,
    others: others.length,
  }), [status, playerName, myId, all.length, others.length]);

  return (
    <div className="relative w-full max-w-[960px]">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
        <span>Player: <strong>{playerName}</strong></span>
        <span>Status: {status}</span>
        <span>ID: {info.id}</span>
        <span>Players online: {info.players}</span>
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
          <p>Your position: x={me.x.toFixed(1)} y={me.y.toFixed(1)}</p>
        </div>
      )}
    </div>
  );
}
