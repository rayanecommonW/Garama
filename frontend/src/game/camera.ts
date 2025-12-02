/**
 * Camera Module
 * Handles camera position updates and following logic.
 */

import { getFreeCamPosition } from './freeCam';
import { GameState } from './gameState';

// ============================================================================
// Public API
// ============================================================================

/** Updates camera position based on current mode (free cam or follow player) */
export function updateCamera(canvas: HTMLCanvasElement) {
  if (GameState.freeCamMode) {
    updateFreeCamCamera(canvas);
  } else {
    updateFollowCamera();
  }
}

// ============================================================================
// Camera Modes
// ============================================================================

/** Updates camera to free cam position */
function updateFreeCamCamera(canvas: HTMLCanvasElement) {
  const { x, y } = getFreeCamPosition();
  GameState.camera.x = x;
  GameState.camera.y = y;
  canvas.style.cursor = 'grab';
}

/** Updates camera to follow local player */
function updateFollowCamera() {
  if (GameState.localPlayerId) {
    const localPlayer = GameState.players.get(GameState.localPlayerId);
    if (localPlayer) {
      GameState.camera.x = localPlayer.x;
      GameState.camera.y = localPlayer.y;
    }
  }
  // Reset zoom when not in free cam
  GameState.freeCamZoom = 1;
}

/** Sets cursor based on current mode and drag state */
export function updateCursor(canvas: HTMLCanvasElement, isDragging: boolean) {
  if (GameState.freeCamMode) {
    canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
  } else {
    canvas.style.cursor = 'default';
  }
}

