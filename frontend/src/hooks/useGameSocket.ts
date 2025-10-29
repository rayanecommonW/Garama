"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerSnapshot } from '../game/types';
import type { Direction } from '../game/types';

const WS_URL = 'ws://localhost:3001/ws';
const WS_OPEN = 1; // WebSocket readyState for OPEN
const MOVEMENT_KEYS = new Set(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright']);
const normalizeKey = (key: string) => key.toLowerCase();
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

type DebugInfo = {
  lastKeyPressed?: string;
  lastDirectionSent?: Direction;
  wsState?: string;
  wsReadyState?: number;
  keyboardActive?: boolean;
  messagesReceived?: number;
  messagesSent?: number;
  keysDown: string[];
};

export default function useGameSocket(playerName: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const messagesReceived = useRef(0);
  const messagesSent = useRef(0);
  const keysDownRef = useRef(new Set<string>());
  const lastPressedKeyRef = useRef<string | null>(null);
  const lastSentDirectionRef = useRef<Direction | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({ keysDown: [] });
  const [status, setStatus] = useState<'idle' | 'connecting' | 'open' | 'closed' | 'error'>('idle');
  const [lastError, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerSnapshot[]>([]);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    const name = playerName.trim() || 'Anonymous';
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    setStatus('connecting');
    setError(null);

    const clientId = readStoredClientId();

    ws.onopen = () => {
      setStatus('open');
      const payload = { type: 'join', name, clientId: clientId ?? undefined };
      ws.send(JSON.stringify(payload));
      messagesSent.current++;
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
              const next: PlayerSnapshot[] = [];
              for (const p of msg.players) {
                if (!p || typeof p.id !== 'string') continue;
                next.push({
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

  // Send direction to server
  const sendDirection = useCallback((direction: Direction) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WS_OPEN) {
      return;
    }

    const payload = { type: 'input', direction };
    try {
      ws.send(JSON.stringify(payload));
      messagesSent.current++;
      setDebugInfo(prev => ({
        ...prev,
        lastDirectionSent: direction,
        messagesSent: messagesSent.current,
        wsReadyState: ws.readyState
      }));
    } catch {
      // ignore transient errors
    }
  }, []);

  // Resolve a direction from keys and last pressed (last-pressed wins)
  const resolveDirection = useCallback((): Direction | null => {
    const keys = keysDownRef.current;
    const last = lastPressedKeyRef.current;
    const hasUp = keys.has('w') || keys.has('arrowup');
    const hasDown = keys.has('s') || keys.has('arrowdown');
    const hasLeft = keys.has('a') || keys.has('arrowleft');
    const hasRight = keys.has('d') || keys.has('arrowright');

    if (last === 'w' || last === 'arrowup') return hasUp ? 'up' : null;
    if (last === 's' || last === 'arrowdown') return hasDown ? 'down' : null;
    if (last === 'a' || last === 'arrowleft') return hasLeft ? 'left' : null;
    if (last === 'd' || last === 'arrowright') return hasRight ? 'right' : null;

    if (hasUp && !hasDown) return 'up';
    if (hasDown && !hasUp) return 'down';
    if (hasLeft && !hasRight) return 'left';
    if (hasRight && !hasLeft) return 'right';
    return null;
  }, []);

  // Interval-based send loop: send on direction change only
  useEffect(() => {
    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      const ws = wsRef.current;
      const ready = ws ? ws.readyState : undefined;
      // keep ws ready state visible
      setDebugInfo(prev => ({ ...prev, wsReadyState: ready }));
      if (!ws || ready !== WS_OPEN) return;
      const dir = resolveDirection();
      const next: Direction = dir ?? 'stop';
      // Always send on each tick for reliability during debugging
      lastSentDirectionRef.current = next;
      sendDirection(next);
    }, 100);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [status, resolveDirection, sendDirection]);

  // Set up keyboard event listeners (always active when component is mounted)
  useEffect(() => {
    const keysDown = keysDownRef.current; // Capture ref for cleanup

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = normalizeKey(event.key);

      // Ignore if typing in an input or textarea
      if (document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Only handle movement keys
      const isMovementKey = MOVEMENT_KEYS.has(key);
      if (!isMovementKey) return;

      event.preventDefault();

      // Add to keys down and remember last pressed
      keysDownRef.current.add(key);
      lastPressedKeyRef.current = key;

      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        lastKeyPressed: key,
        keyboardActive: true,
        keysDown: Array.from(keysDownRef.current)
      }));

      // Immediate send to avoid relying solely on loop
      const dir = resolveDirection();
      const next: Direction = dir ?? 'stop';
      if (lastSentDirectionRef.current !== next) {
        lastSentDirectionRef.current = next;
        sendDirection(next);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = normalizeKey(event.key);

      // Only handle movement keys
      const isMovementKey = MOVEMENT_KEYS.has(key);
      if (!isMovementKey) return;

      event.preventDefault();

      // Remove from keys down
      keysDownRef.current.delete(key);

      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        keysDown: Array.from(keysDownRef.current)
      }));

      // Immediate send to reflect released key promptly
      const dir = resolveDirection();
      const next: Direction = dir ?? 'stop';
      if (lastSentDirectionRef.current !== next) {
        lastSentDirectionRef.current = next;
        sendDirection(next);
      }
    };

    // Handle window focus/blur to clear keys when tab is switched
    const handleBlur = () => {
      keysDownRef.current.clear();
      setDebugInfo(prev => ({
        ...prev,
        keysDown: []
      }));
      // Ensure a single stop is sent promptly
      if (lastSentDirectionRef.current !== 'stop') {
        lastSentDirectionRef.current = 'stop';
        sendDirection('stop');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Mark keyboard as active
    setDebugInfo(prev => ({ ...prev, keyboardActive: true }));

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      // Clear keys and update debug info
      keysDown.clear();
      setDebugInfo(prev => ({ ...prev, keyboardActive: false, keysDown: [] }));
    };
  }, [sendDirection, resolveDirection]);

  return {
    players,
    myId,
    status,
    lastError,
    debugInfo,
  };
}
