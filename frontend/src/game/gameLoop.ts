import { renderFrame } from './renderer';
import { GameState } from './gameState';
import { updatePlayerMovement } from './movement';
import type { Socket } from 'socket.io-client';

let rafId: number | null = null;
let isRunning = false;
let lastTime = 0;
let socketRef: Socket | null = null;
let lastPositionUpdate = 0;
let onMessageSent: (() => void) | null = null;

export function setSocket(socket: Socket | null) {
  socketRef = socket;
}

export function setOnMessageSent(callback: (() => void) | null) {
  onMessageSent = callback;
}

function sendPositionUpdate() {
  if (!socketRef || !GameState.localPlayerId) return;

  const player = GameState.players.get(GameState.localPlayerId);
  if (!player) return;

  socketRef.emit('position', {
    type: 'position',
    x: player.x,
    y: player.y,
  });
  onMessageSent?.();
}

export function startGameLoop(canvas: HTMLCanvasElement) {
  if (isRunning) return;
  
  isRunning = true;
  lastTime = performance.now();
  lastPositionUpdate = performance.now();
  
  function frame(currentTime: number) {
    if (!isRunning) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    updatePlayerMovement(deltaTime);
    
    if (currentTime - lastPositionUpdate > 50) {
      sendPositionUpdate();
      lastPositionUpdate = currentTime;
    }
    
    if (GameState.localPlayerId) {
      const localPlayer = GameState.players.get(GameState.localPlayerId);
      if (localPlayer) {
        GameState.camera.x = localPlayer.x;
        GameState.camera.y = localPlayer.y;
      }
    }
    
    renderFrame(canvas, GameState);
    
    rafId = requestAnimationFrame(frame);
  }
  
  rafId = requestAnimationFrame(frame);
}

export function stopGameLoop() {
  isRunning = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
