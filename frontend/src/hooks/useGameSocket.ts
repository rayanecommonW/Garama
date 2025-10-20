"use client";
import { useCallback, useEffect, useRef, useState } from 'react';

export type PlayerSnapshot = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
};

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

const WS_URL = 'ws://localhost:3001/ws';
const STORAGE_KEY = 'garama_client_id';

function readStoredClientId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeClientId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore storage errors (private mode, etc.)
  }
}

export default function useGameSocket(playerName: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const connectionAttempt = useRef(0);

  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [players, setPlayers] = useState<Map<string, PlayerSnapshot>>(new Map());
  const [myId, setMyId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const name = playerName.trim() || 'Anonymous';
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    connectionAttempt.current += 1;
    setStatus('connecting');
    setLastError(null);

    const clientId = readStoredClientId();

    ws.onopen = () => {
      setStatus('open');
      const payload = {
        type: 'join',
        name,
        clientId: clientId ?? undefined,
      };
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'welcome':
            if (typeof msg.myId === 'string') {
              setMyId(msg.myId);
              storeClientId(msg.myId);
            }
            break;
          case 'gameState':
            if (Array.isArray(msg.players)) {
              const next = new Map<string, PlayerSnapshot>();
              for (const p of msg.players) {
                if (!p || typeof p.id !== 'string') continue;
                next.set(p.id, {
                  id: p.id,
                  name: typeof p.name === 'string' ? p.name : 'Anonymous',
                  x: Number(p.x) || 0,
                  y: Number(p.y) || 0,
                  color: typeof p.color === 'string' ? p.color : '#ffffff',
                  vx: Number(p.vx) || 0,
                  vy: Number(p.vy) || 0,
                });
              }
              setPlayers(next);
            }
            break;
          default:
            break;
        }
      } catch (error) {
        setLastError('Failed to parse server message');
        console.error('Failed to parse websocket message', error);
      }
    };

    ws.onerror = () => {
      setStatus('error');
      setLastError('WebSocket encountered an error');
    };

    ws.onclose = () => {
      setStatus('closed');
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [playerName]);

  const sendDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right' | 'stop') => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const payload = {
      type: 'input',
      direction,
    };
    try {
      ws.send(JSON.stringify(payload));
    } catch (error) {
      setLastError('Failed to send input');
      console.error('Failed to send direction', error);
    }
  }, []);

  return {
    players,
    myId,
    status,
    lastError,
    connectionAttempts: connectionAttempt.current,
    sendDirection,
  };
}
