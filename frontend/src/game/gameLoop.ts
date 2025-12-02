/**
 * Game Loop Module
 * Main game loop handling updates and rendering.
 */

import { updateCamera, updateCursor } from './camera';
import { updateFreeCam, setupFreeCamHandlers, isDraggingCamera } from './freeCam';
import { GameState } from './gameState';
import { updatePlayerMovement } from './movement';
import { renderFrame } from './renderer';

import type { Socket } from 'socket.io-client';

// ============================================================================
// State
// ============================================================================

let rafId: number | null = null;
let isRunning = false;
let lastTime = 0;
let socketRef: Socket | null = null;
let lastPositionUpdate = 0;
let onMessageSent: (() => void) | null = null;
let cleanupHandlers: (() => void) | null = null;

// ============================================================================
// Socket Management
// ============================================================================

/** Sets the socket reference for position updates */
export function setSocket(socket: Socket | null) {
  socketRef = socket;
}

/** Sets callback for when messages are sent */
export function setOnMessageSent(callback: (() => void) | null) {
  onMessageSent = callback;
}

// ============================================================================
// Network Updates
// ============================================================================

/** Sends player position to server */
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

// ============================================================================
// Game Loop
// ============================================================================

/** Starts the game loop */
export function startGameLoop(canvas: HTMLCanvasElement) {
  if (isRunning) return;

  isRunning = true;
  lastTime = performance.now();
  lastPositionUpdate = performance.now();

  // Setup event handlers
  cleanupHandlers = setupFreeCamHandlers(canvas);

  function frame(currentTime: number) {
    if (!isRunning) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // Update game state
    update(deltaTime, canvas);

    // Send position updates at fixed rate
    if (currentTime - lastPositionUpdate > 50) {
      sendPositionUpdate();
      lastPositionUpdate = currentTime;
    }

    // Render
    renderFrame(canvas, GameState);

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);
}

/** Stops the game loop */
export function stopGameLoop() {
  isRunning = false;

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (cleanupHandlers) {
    cleanupHandlers();
    cleanupHandlers = null;
  }
}

// ============================================================================
// Update Logic
// ============================================================================

/** Main update function called each frame */
function update(deltaMs: number, canvas: HTMLCanvasElement) {
  // Update based on mode
  if (GameState.freeCamMode) {
    updateFreeCam(deltaMs);
  } else {
    updatePlayerMovement(deltaMs);
  }

  // Update camera position
  updateCamera(canvas);

  // Update cursor based on state
  updateCursor(canvas, isDraggingCamera());
}

// ============================================================================
// Re-exports for external access
// ============================================================================

export { resetFreeCamToPlayer } from './freeCam';
