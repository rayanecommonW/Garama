import { MAP_WIDTH, MAP_HEIGHT } from '@garama/shared';
import { getFreeCamPosition } from './freeCam';
import { GameState } from './gameState';

// Camera configuration constants
const CAMERA_LERP_HORIZONTAL = 0.03; // Slower horizontal lerp for smoother feel
const CAMERA_LERP_VERTICAL = 0.02; // Even slower vertical to reduce jump nausea
const LOOK_AHEAD_LERP = 0.025; // Very slow lerp for look-ahead direction changes
const DEADZONE_WIDTH = 100;
const DEADZONE_HEIGHT = 80;
const LOOK_AHEAD_PX = 150;
const BORDER_VISIBLE_FRACTION = 0.25; // Show up to 25% of viewport beyond world edge

/**
 * Clamps a value between a minimum and maximum.
 */
function clamp(min: number, value: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Updates the camera position based on the current mode (free cam or follow).
 */
export function updateCamera(canvas: HTMLCanvasElement) {
  if (GameState.freeCamMode) {
    updateFreeCamCamera(canvas);
  } else {
    updateFollowCamera();
  }
}

/**
 * Updates camera position in free cam mode (debug/editor).
 */
function updateFreeCamCamera(canvas: HTMLCanvasElement) {
  const { x, y } = getFreeCamPosition();
  GameState.camera.x = x;
  GameState.camera.y = y;
  canvas.style.cursor = 'grab';
}

/**
 * Implements smart camera follow with deadzone, look-ahead, lerp smoothing, and world clamping.
 */
function updateFollowCamera() {
  GameState.freeCamZoom = 1;

  if (!GameState.localPlayerId) return;

  const localPlayer = GameState.players.get(GameState.localPlayerId);
  if (!localPlayer) return;

  const camera = GameState.camera;
  const playerX = localPlayer.x;
  const playerY = localPlayer.y;

  // --- Step 1: Update focus point with deadzone ---
  // Only move the focus if the player exits the deadzone rectangle.
  const deltaX = playerX - camera.focusX;
  const deltaY = playerY - camera.focusY;

  // Horizontal deadzone check
  if (Math.abs(deltaX) > DEADZONE_WIDTH / 2) {
    // Player exited horizontal deadzone, move focus to keep player at edge
    const sign = deltaX > 0 ? 1 : -1;
    camera.focusX = playerX - sign * (DEADZONE_WIDTH / 2);
  }

  // Vertical deadzone check
  if (Math.abs(deltaY) > DEADZONE_HEIGHT / 2) {
    // Player exited vertical deadzone, move focus to keep player at edge
    const sign = deltaY > 0 ? 1 : -1;
    camera.focusY = playerY - sign * (DEADZONE_HEIGHT / 2);
  }

  // --- Step 2: Smoothly lerp the look-ahead offset based on player facing ---
  const facing = localPlayer.facing;
  let targetLookAhead = camera.lookAheadOffset;

  if (facing === 'left') {
    targetLookAhead = -LOOK_AHEAD_PX;
  } else if (facing === 'right') {
    targetLookAhead = LOOK_AHEAD_PX;
  }
  // If facing is 'up' or 'down', keep the previous look-ahead offset

  // Smoothly interpolate the look-ahead offset (prevents abrupt direction changes)
  camera.lookAheadOffset = lerp(camera.lookAheadOffset, targetLookAhead, LOOK_AHEAD_LERP);

  // --- Step 3: Calculate target camera position (focus + lerped look-ahead) ---
  const targetX = camera.focusX + camera.lookAheadOffset;
  const targetY = camera.focusY;

  // --- Step 4: Lerp camera toward target (separate factors for smoother vertical) ---
  camera.x = lerp(camera.x, targetX, CAMERA_LERP_HORIZONTAL);
  camera.y = lerp(camera.y, targetY, CAMERA_LERP_VERTICAL);

  // --- Step 5: Clamp camera to world bounds (allowing some border visibility) ---
  // Allow up to BORDER_VISIBLE_FRACTION of the viewport to show beyond the world edge.
  const halfViewportW = GameState.viewportWidth / 2;
  const halfViewportH = GameState.viewportHeight / 2;
  const borderMarginW = halfViewportW * BORDER_VISIBLE_FRACTION;
  const borderMarginH = halfViewportH * BORDER_VISIBLE_FRACTION;

  // Minimum camera position: allows left/bottom edge of viewport to extend beyond world origin
  // Maximum camera position: allows right/top edge of viewport to extend beyond world max
  const minCameraX = halfViewportW - borderMarginW;
  const maxCameraX = MAP_WIDTH - halfViewportW + borderMarginW;
  const minCameraY = halfViewportH - borderMarginH;
  const maxCameraY = MAP_HEIGHT - halfViewportH + borderMarginH;

  // Handle edge case where map is smaller than viewport
  if (minCameraX < maxCameraX) {
    camera.x = clamp(minCameraX, camera.x, maxCameraX);
  } else {
    camera.x = MAP_WIDTH / 2; // Center on map if too small
  }

  if (minCameraY < maxCameraY) {
    camera.y = clamp(minCameraY, camera.y, maxCameraY);
  } else {
    camera.y = MAP_HEIGHT / 2; // Center on map if too small
  }
}

/**
 * Updates the cursor style based on camera mode and drag state.
 */
export function updateCursor(canvas: HTMLCanvasElement, isDragging: boolean) {
  if (GameState.freeCamMode) {
    canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
  } else {
    canvas.style.cursor = 'default';
  }
}
