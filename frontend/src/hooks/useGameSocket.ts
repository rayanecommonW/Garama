"use client";
import { useEffect, useRef, useState } from 'react';
import type { PlayerSnapshot, Direction } from '@garama/shared';

const WS_URL = 'ws://localhost:3001/ws';
const WS_OPEN = 1;
const STORAGE_KEY = 'garama_client_id';

const readStoredClientId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeClientId = (id: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, id);
  } catch {}
};

type DebugInfo = {
  wsState?: string;
  wsReadyState?: number;
  messagesReceived?: number;
  messagesSent?: number;
};

export default function useGameSocket(playerName: string, currentDirection: Direction) {
  const wsRef = useRef<WebSocket | null>(null);
  const messagesReceived = useRef(0);
  const messagesSent = useRef(0);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'open' | 'closed' | 'error'>('idle');
  const [lastError, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerSnapshot[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});

  useEffect(() => {
    const name = playerName.trim() || 'Anonymous';
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    setStatus('connecting');
    setError(null);

    const clientId = readStoredClientId();

    ws.onopen = () => {
      setStatus('open');
      messagesSent.current++;
      const payload = { type: 'join', name, clientId: clientId ?? undefined };
      ws.send(JSON.stringify(payload));
      setDebugInfo(prev => ({ ...prev, wsState: 'open', wsReadyState: ws.readyState, messagesSent: messagesSent.current }));
    };

    ws.onmessage = (event) => {
      try {
        messagesReceived.current++;
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
              setPlayers(msg.players.map((p: Record<string, unknown>) => ({
                id: p.id,
                name: typeof p.name === 'string' ? p.name : 'Anonymous',
                x: Number(p.x) || 0,
                y: Number(p.y) || 0,
                color: typeof p.color === 'string' ? p.color : '#ffffff',
                vx: Number(p.vx) || 0,
                vy: Number(p.vy) || 0,
              })));
            }
            break;
        }
        setDebugInfo(prev => ({ ...prev, messagesReceived: messagesReceived.current }));
      } catch {
        setError('Failed to parse server message');
      }
    };

    ws.onerror = () => {
      setStatus('error');
      setError('WebSocket encountered an error');
      setDebugInfo(prev => ({ ...prev, wsState: 'error' }));
    };

    ws.onclose = () => {
      setStatus('closed');
      setMyId(null);
      setPlayers([]);
      wsRef.current = null;
      setDebugInfo(prev => ({ ...prev, wsState: 'closed' }));
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [playerName]);

  useEffect(() => {
    if (status !== 'open') return;

    const interval = setInterval(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WS_OPEN) return;

      const payload = { type: 'input', direction: currentDirection };
      try {
        ws.send(JSON.stringify(payload));
        messagesSent.current++;
        setDebugInfo(prev => ({
          ...prev,
          messagesSent: messagesSent.current,
          wsReadyState: ws.readyState
        }));
      } catch {}
    }, 100);

    return () => clearInterval(interval);
  }, [status, currentDirection]);

  return { players, myId, status, lastError, debugInfo };
}
