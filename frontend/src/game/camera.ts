import { getFreeCamPosition } from './freeCam';
import { GameState } from './gameState';

export function updateCamera(canvas: HTMLCanvasElement) {
  if (GameState.freeCamMode) {
    updateFreeCamCamera(canvas);
  } else {
    updateFollowCamera();
  }
}

function updateFreeCamCamera(canvas: HTMLCanvasElement) {
  const { x, y } = getFreeCamPosition();
  GameState.camera.x = x;
  GameState.camera.y = y;
  canvas.style.cursor = 'grab';
}

function updateFollowCamera() {
  if (GameState.localPlayerId) {
    const localPlayer = GameState.players.get(GameState.localPlayerId);
    if (localPlayer) {
      GameState.camera.x = localPlayer.x;
      GameState.camera.y = localPlayer.y;
    }
  }
  GameState.freeCamZoom = 1;
}

export function updateCursor(canvas: HTMLCanvasElement, isDragging: boolean) {
  if (GameState.freeCamMode) {
    canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
  } else {
    canvas.style.cursor = 'default';
  }
}
