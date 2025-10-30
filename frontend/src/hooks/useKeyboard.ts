"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Direction } from '@garama/shared';

const MOVEMENT_KEYS = new Set(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright']);
const normalizeKey = (key: string) => key.toLowerCase();

type KeyboardDebugInfo = {
  lastKeyPressed?: string;
  lastDirectionSent?: Direction;
  keyboardActive?: boolean;
  keysDown: string[];
};

export default function useKeyboard() {
  const keysDownRef = useRef(new Set<string>());
  const lastPressedKeyRef = useRef<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<KeyboardDebugInfo>({ keysDown: [] });
  const [currentDirection, setCurrentDirection] = useState<Direction>('stop');

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

  useEffect(() => {
    const keysDown = keysDownRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA') return;

      const key = normalizeKey(event.key);
      if (!MOVEMENT_KEYS.has(key)) return;

      event.preventDefault();
      keysDownRef.current.add(key);
      lastPressedKeyRef.current = key;

      const dir = resolveDirection();
      const next: Direction = dir ?? 'stop';
      setCurrentDirection(next);
      setDebugInfo(prev => ({
        ...prev,
        lastKeyPressed: key,
        keyboardActive: true,
        lastDirectionSent: next,
        keysDown: Array.from(keysDownRef.current)
      }));
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = normalizeKey(event.key);
      if (!MOVEMENT_KEYS.has(key)) return;

      event.preventDefault();
      keysDownRef.current.delete(key);

      const dir = resolveDirection();
      const next: Direction = dir ?? 'stop';
      setCurrentDirection(next);
      setDebugInfo(prev => ({
        ...prev,
        lastDirectionSent: next,
        keysDown: Array.from(keysDownRef.current)
      }));
    };

    const handleBlur = () => {
      keysDownRef.current.clear();
      setCurrentDirection('stop');
      setDebugInfo(prev => ({
        ...prev,
        lastDirectionSent: 'stop',
        keysDown: []
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    setDebugInfo(prev => ({ ...prev, keyboardActive: true }));

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      keysDown.clear();
      setDebugInfo(prev => ({ ...prev, keyboardActive: false, keysDown: [] }));
    };
  }, [resolveDirection]);

  return { currentDirection, debugInfo };
}
