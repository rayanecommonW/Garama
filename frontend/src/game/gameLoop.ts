import { updateCamera, updateCursor } from './camera';
import { updateFreeCam, setupFreeCamHandlers, isDraggingCamera } from './freeCam';
import { GameState } from './gameState';
import { updatePlayerMovement } from './movement';
import { renderFrame } from './renderer';

import type { Socket } from 'socket.io-client';

let rafId: number | null = null;
let isRunning = false;
let lastTime = 0;
let socketRef: Socket | null = null;
let lastPositionUpdate = 0;
let onMessageSent: (() => void) | null = null;
let cleanupHandlers: (() => void) | null = null;

const POSITION_UPDATE_INTERVAL_MS = 50;

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

  cleanupHandlers = setupFreeCamHandlers(canvas);

  function frame(currentTime: number) {
    if (!isRunning) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    update(deltaTime, canvas);

    if (currentTime - lastPositionUpdate > POSITION_UPDATE_INTERVAL_MS) {
      sendPositionUpdate();
      lastPositionUpdate = currentTime;
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

  if (cleanupHandlers) {
    cleanupHandlers();
    cleanupHandlers = null;
  }
}

function update(deltaMs: number, canvas: HTMLCanvasElement) {
  if (GameState.freeCamMode) {
    updateFreeCam(deltaMs);
  } else {
    updatePlayerMovement(deltaMs);
  }

  updateCamera(canvas);
  updateCursor(canvas, isDraggingCamera());
}

export { resetFreeCamToPlayer } from './freeCam';
