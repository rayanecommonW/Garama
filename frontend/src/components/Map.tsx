'use client';
import { MAP_HEADER_HEIGHT } from '@garama/shared';
import { useEffect, useRef } from 'react';

import { startGameLoop, stopGameLoop } from '../game/gameLoop';
import { initInput, type KeyBindings } from '../game/input';

type Props = {
  width?: number;
  height?: number;
  keyBindings: KeyBindings;
};

export default function Map({ width, height, keyBindings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasWidth = width ?? window.innerWidth;
    const canvasHeight = height ?? window.innerHeight - MAP_HEADER_HEIGHT;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const cleanupInput = initInput(keyBindings);

    startGameLoop(canvas);

    const handleResize = () => {
      const newWidth = width ?? window.innerWidth;
      const newHeight = height ?? window.innerHeight - MAP_HEADER_HEIGHT;
      canvas.width = newWidth;
      canvas.height = newHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      stopGameLoop();
      cleanupInput();
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height, keyBindings]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed right-0 bottom-0 left-0 z-0"
      style={{ top: `${MAP_HEADER_HEIGHT}px` }}
    />
  );
}
