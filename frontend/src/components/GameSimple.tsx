"use client";
import { useMemo, useRef, useState } from 'react';
import useGameSocket from '../hooks/useGameSocket';
import useGameRenderer from '../hooks/useGameRenderer';
import useKeyboard from '../hooks/useKeyboard';

type Props = {
  playerName: string;
};

export default function GameSimple({ playerName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const { currentDirection, debugInfo: kbDebug } = useKeyboard();
  const { players, myId, status, lastError, debugInfo: wsDebug } = useGameSocket(playerName, currentDirection);

  const me = useMemo(() => (myId ? players.find(p => p.id === myId) ?? null : null), [players, myId]);

  useGameRenderer(canvasRef, { players, myId });

  return (
    <div className="relative w-full max-w-[960px]">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
        <span>Player: <strong>{playerName}</strong></span>
        <div className="flex items-center gap-4">
          <span>Status: {status}</span>
          <span>Players: {players.length}</span>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded"
          >
            {debugMode ? 'Hide' : 'Show'} Debug
          </button>
        </div>
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

      {debugMode && (
        <div className="mt-3 text-xs text-slate-400 border-t border-slate-700 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div>WS: {wsDebug.wsState || status}</div>
            <div>WS ready: {wsDebug.wsReadyState ?? '—'}</div>
            <div>Kbd: {kbDebug.keyboardActive ? '✓' : '✗'}</div>
            <div>Key: {kbDebug.lastKeyPressed || '—'}</div>
            <div>Dir: {kbDebug.lastDirectionSent || '—'}</div>
            <div>Keys: [{kbDebug.keysDown.join(', ') || 'none'}]</div>
            <div>Msgs: ↑{wsDebug.messagesSent || 0} ↓{wsDebug.messagesReceived || 0}</div>
            <div>ID: {myId ?? '—'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
