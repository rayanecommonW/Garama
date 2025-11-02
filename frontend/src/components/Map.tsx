"use client";
import { useEffect, useRef } from 'react';
import { MAP_HEADER_HEIGHT } from '@garama/shared';
import { startGameLoop, stopGameLoop } from '../game/gameLoop';
import { initInput } from '../game/input';

type Props = {
  width?: number;
  height?: number;
};

/**
 * Game canvas component - uses rAF loop for rendering
 * Game state is kept outside React in gameState module
 */
export default function Map({ width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const canvasWidth = width ?? window.innerWidth;
    const canvasHeight = height ?? window.innerHeight - MAP_HEADER_HEIGHT;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Initialize input handlers
    const cleanupInput = initInput();

    // Start game loop
    startGameLoop(canvas);

    // Handle window resize
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
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed left-0 right-0 bottom-0 z-0"
      style={{ top: `${MAP_HEADER_HEIGHT}px` }}
    />
  );
}

