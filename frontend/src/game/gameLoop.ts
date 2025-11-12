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

/**
 * Sets the socket for sending position updates
 */
export function setSocket(socket: Socket | null) {
  socketRef = socket;
}

/**
 * Sets the callback for when messages are sent
 */
export function setOnMessageSent(callback: (() => void) | null) {
  onMessageSent = callback;
}

/**
 * Sends position update to server
 */
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

/**
 * Starts the game loop using requestAnimationFrame
 */
export function startGameLoop(canvas: HTMLCanvasElement) {
  if (isRunning) return;
  
  isRunning = true;
  lastTime = performance.now();
  lastPositionUpdate = performance.now();
  
  function frame(currentTime: number) {
    if (!isRunning) return;
    
    // Calculate delta time
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Update player movement
    updatePlayerMovement(deltaTime);
    
    // Send position updates every 50ms (20 times per second)
    if (currentTime - lastPositionUpdate > 50) {
      sendPositionUpdate();
      lastPositionUpdate = currentTime;
    }
    
    // Update camera to follow local player
    if (GameState.localPlayerId) {
      const localPlayer = GameState.players.get(GameState.localPlayerId);
      if (localPlayer) {
        GameState.camera.x = localPlayer.x;
        GameState.camera.y = localPlayer.y;
      }
    }
    
    // Render frame
    renderFrame(canvas, GameState);
    
    rafId = requestAnimationFrame(frame);
  }
  
  rafId = requestAnimationFrame(frame);
}

/**
 * Stops the game loop
 */
export function stopGameLoop() {
  isRunning = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

