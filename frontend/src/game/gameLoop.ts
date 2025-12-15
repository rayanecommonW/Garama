import { updateCamera, updateCursor } from './camera';
import { updateChatBubbles } from './chatBubbles';
import { updateFreeCam, setupFreeCamHandlers, isDraggingCamera } from './freeCam';
import { GameState } from './gameState';
import { Input } from './input';
import { updatePlayerMovement } from './movement';
import { interpolateRemotePlayers } from './net/interpolateRemotePlayers';
import { renderFrame } from './renderer';
import { updateSprintDust } from './sprintDust';

import type { AttackDirection } from '@garama/shared';
import type { Socket } from 'socket.io-client';

let rafId: number | null = null;
let isRunning = false;
let lastTime = 0;
let socketRef: Socket | null = null;
let onMessageSent: (() => void) | null = null;
let cleanupHandlers: (() => void) | null = null;
let positionSendTimer: number | null = null;
let wasAttackHeld = false;
let hasSentAttackHoldStart = false;

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

function resolveAttackDirection(player: { onGround: boolean; vx: number; facing?: AttackDirection }): AttackDirection {
  if (Input.down && !player.onGround) return 'down';
  if (Input.up) return 'up';
  if (Input.left) return 'left';
  if (Input.right) return 'right';
  return player.facing ?? (player.vx < 0 ? 'left' : 'right');
}

function handleAttackInput() {
  const isHeldNow = Input.attack;
  const pressed = isHeldNow && !wasAttackHeld;
  const released = !isHeldNow && wasAttackHeld;
  wasAttackHeld = isHeldNow;

  if (pressed) {
    hasSentAttackHoldStart = false;
  }

  if (isHeldNow && !hasSentAttackHoldStart) {
    if (!socketRef || !GameState.localPlayerId) return;
    const player = GameState.players.get(GameState.localPlayerId);
    if (!player || player.isDead) return;

    socketRef.emit('attack_hold_start', { type: 'attack_hold_start' });
    onMessageSent?.();
    hasSentAttackHoldStart = true;
  }

  if (!released) return;

  hasSentAttackHoldStart = false;
  if (!socketRef || !GameState.localPlayerId) return;
  const player = GameState.players.get(GameState.localPlayerId);
  if (!player || player.isDead) return;

  const direction = resolveAttackDirection(player);
  socketRef.emit('attack_release', {
    type: 'attack_release',
    direction,
    isAirborne: !player.onGround,
    clientTime: performance.now(),
  });
  onMessageSent?.();
}

function decayHitFlashes(deltaMs: number) {
  GameState.players.forEach((player) => {
    if (!player.hitFlashMs || player.hitFlashMs <= 0) return;
    player.hitFlashMs = Math.max(0, player.hitFlashMs - deltaMs);
  });
}

function decayAttackVfx(deltaMs: number) {
  GameState.players.forEach((player) => {
    if (!player.attackMsLeft || player.attackMsLeft <= 0) return;
    player.attackMsLeft = Math.max(0, player.attackMsLeft - deltaMs);
  });
}

export function startGameLoop(canvas: HTMLCanvasElement) {
  if (isRunning) return;

  isRunning = true;
  lastTime = performance.now();
  positionSendTimer = window.setInterval(sendPositionUpdate, POSITION_UPDATE_INTERVAL_MS);

  cleanupHandlers = setupFreeCamHandlers(canvas);

  function frame(currentTime: number) {
    if (!isRunning) return;

    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    update(deltaTime, canvas);

    interpolateRemotePlayers(currentTime);
    renderFrame(canvas, GameState);

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);
}

export function stopGameLoop() {
  isRunning = false;
  wasAttackHeld = false;
  hasSentAttackHoldStart = false;

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (positionSendTimer !== null) {
    clearInterval(positionSendTimer);
    positionSendTimer = null;
  }

  if (cleanupHandlers) {
    cleanupHandlers();
    cleanupHandlers = null;
  }
}

function update(deltaMs: number, canvas: HTMLCanvasElement) {
  const nowMs = performance.now();

  if (GameState.freeCamMode) {
    updateFreeCam(deltaMs);
  } else {
    updatePlayerMovement(deltaMs);
  }

  updateSprintDust(deltaMs);

  handleAttackInput();
  updateChatBubbles(nowMs);
  decayHitFlashes(deltaMs);
  decayAttackVfx(deltaMs);

  updateCamera(canvas);
  updateCursor(canvas, isDraggingCamera());
}

export { resetFreeCamToPlayer } from './freeCam';
