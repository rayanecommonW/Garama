import { GameState } from './gameState';

const FREE_CAM_SPEED = 800;
const DRAG_SENSITIVITY = 1;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 3;
const ZOOM_FACTOR = 1.08;

let freeCamX = 0;
let freeCamY = 0;

const keyboardInput = {
  up: false,
  down: false,
  left: false,
  right: false,
};

let isDragging = false;
let lastDragX = 0;
let lastDragY = 0;

export function getFreeCamPosition() {
  return { x: freeCamX, y: freeCamY };
}

export function resetFreeCamToPlayer() {
  if (GameState.localPlayerId) {
    const player = GameState.players.get(GameState.localPlayerId);
    if (player) {
      freeCamX = player.x;
      freeCamY = player.y;
    }
  }
  GameState.freeCamZoom = 1;
  resetInputState();
}

export function updateFreeCam(deltaMs: number) {
  if (!GameState.freeCamMode) return;

  const dtSec = deltaMs / 1000;
  const speed = FREE_CAM_SPEED / GameState.freeCamZoom;

  if (keyboardInput.up) freeCamY += speed * dtSec;
  if (keyboardInput.down) freeCamY -= speed * dtSec;
  if (keyboardInput.left) freeCamX -= speed * dtSec;
  if (keyboardInput.right) freeCamX += speed * dtSec;
}

export function setupFreeCamHandlers(canvas: HTMLCanvasElement): () => void {
  const cleanupMouse = setupMouseHandlers(canvas);
  const cleanupKeyboard = setupKeyboardHandlers();
  const cleanupWheel = setupWheelHandler(canvas);

  return () => {
    cleanupMouse();
    cleanupKeyboard();
    cleanupWheel();
  };
}

export function isDraggingCamera(): boolean {
  return isDragging;
}

function setupMouseHandlers(canvas: HTMLCanvasElement): () => void {
  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    updateMouseWorldCoords(screenX, screenY);

    if (GameState.freeCamMode && isDragging) {
      const dx = e.clientX - lastDragX;
      const dy = e.clientY - lastDragY;

      freeCamX -= (dx / GameState.freeCamZoom) * DRAG_SENSITIVITY;
      freeCamY += (dy / GameState.freeCamZoom) * DRAG_SENSITIVITY;

      lastDragX = e.clientX;
      lastDragY = e.clientY;
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (GameState.freeCamMode && e.button === 0) {
      isDragging = true;
      lastDragX = e.clientX;
      lastDragY = e.clientY;
      canvas.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      if (GameState.freeCamMode) {
        canvas.style.cursor = 'grab';
      }
    }
  };

  const handleMouseLeave = () => {
    isDragging = false;
  };

  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('mousedown', handleMouseDown);
    canvas.removeEventListener('mouseup', handleMouseUp);
    canvas.removeEventListener('mouseleave', handleMouseLeave);
  };
}

function updateMouseWorldCoords(screenX: number, screenY: number) {
  const zoom = GameState.freeCamZoom;
  const cameraLeft = GameState.camera.x - GameState.viewportWidth / 2 / zoom;
  const cameraTop = GameState.camera.y - GameState.viewportHeight / 2 / zoom;

  GameState.mouse.screenX = screenX;
  GameState.mouse.screenY = screenY;
  GameState.mouse.worldX = Math.round(cameraLeft + screenX / zoom);
  GameState.mouse.worldY = Math.round(cameraTop + (GameState.viewportHeight - screenY) / zoom);
}

function setupKeyboardHandlers(): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!GameState.freeCamMode) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        keyboardInput.up = true;
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        keyboardInput.down = true;
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keyboardInput.left = true;
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        keyboardInput.right = true;
        e.preventDefault();
        break;
      case '+':
      case '=':
        zoomIn();
        e.preventDefault();
        break;
      case '-':
      case '_':
        zoomOut();
        e.preventDefault();
        break;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        keyboardInput.up = false;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        keyboardInput.down = false;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        keyboardInput.left = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        keyboardInput.right = false;
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}

function setupWheelHandler(canvas: HTMLCanvasElement): () => void {
  const handleWheel = (e: WheelEvent) => {
    if (!GameState.freeCamMode) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const isZoomingIn = e.deltaY < 0;

    applyZoomAtPoint(screenX, screenY, isZoomingIn);
  };

  canvas.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    canvas.removeEventListener('wheel', handleWheel);
  };
}

function applyZoomAtPoint(screenX: number, screenY: number, isZoomingIn: boolean) {
  const oldZoom = GameState.freeCamZoom;

  const newZoom = isZoomingIn
    ? Math.min(ZOOM_MAX, oldZoom * ZOOM_FACTOR)
    : Math.max(ZOOM_MIN, oldZoom / ZOOM_FACTOR);

  if (Math.abs(newZoom - oldZoom) < 0.001) return;

  const halfW = GameState.viewportWidth / 2;
  const halfH = GameState.viewportHeight / 2;
  const worldX = freeCamX + (screenX - halfW) / oldZoom;
  const worldY = freeCamY + (halfH - screenY) / oldZoom;

  GameState.freeCamZoom = newZoom;

  freeCamX = worldX - (screenX - halfW) / newZoom;
  freeCamY = worldY - (halfH - screenY) / newZoom;
}

function zoomIn() {
  const centerX = GameState.viewportWidth / 2;
  const centerY = GameState.viewportHeight / 2;
  applyZoomAtPoint(centerX, centerY, true);
}

function zoomOut() {
  const centerX = GameState.viewportWidth / 2;
  const centerY = GameState.viewportHeight / 2;
  applyZoomAtPoint(centerX, centerY, false);
}

function resetInputState() {
  keyboardInput.up = false;
  keyboardInput.down = false;
  keyboardInput.left = false;
  keyboardInput.right = false;
  isDragging = false;
}
