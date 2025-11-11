import { renderFrame } from './renderer';
import { GameState } from './gameState';
import { Input } from './input';
import { PLAYER_SPEED, MAP_WIDTH, MAP_HEIGHT, PLAYER_RADIUS } from '@garama/shared';
import { circlePolygonCollision, resolveCirclePolygonCollision } from '@garama/shared';
import type { Socket } from 'socket.io-client';
import type { Point } from '@garama/shared';

let rafId: number | null = null;
let isRunning = false;
let lastTime = 0;
let socketRef: Socket | null = null;
let lastPositionUpdate = 0;
let onMessageSent: (() => void) | null = null;

/**
 * Updates player position based on input
 */
function updatePlayerMovement(deltaTime: number) {
  if (!GameState.localPlayerId) return;

  const player = GameState.players.get(GameState.localPlayerId);
  if (!player) return;

  // Calculate movement direction
  let dx = 0;
  let dy = 0;

  if (Input.d) dx += 1; // right
  if (Input.q) dx -= 1; // left
  if (Input.s) dy -= 1; // down (decrease Y moves down in bottom-left coordinate system)
  if (Input.z) dy += 1; // up (increase Y moves up in bottom-left coordinate system)

  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    dx *= 0.707; // 1 / sqrt(2)
    dy *= 0.707;
  }

  // Calculate new position
  const speed = PLAYER_SPEED * (deltaTime / 1000); // convert to pixels per frame
  let newX = player.x + dx * speed;
  let newY = player.y + dy * speed;

  // Keep player within map bounds
  newX = Math.max(PLAYER_RADIUS, Math.min(MAP_WIDTH - PLAYER_RADIUS, newX));
  newY = Math.max(PLAYER_RADIUS, Math.min(MAP_HEIGHT - PLAYER_RADIUS, newY));

  // Check collision with all static objects
  let finalX = newX;
  let finalY = newY;

  for (const obj of GameState.objects) {
    const newCenter: Point = [finalX, finalY];
    
    if (circlePolygonCollision(newCenter, player.radius, obj.polygon)) {
      // Collision detected - resolve it
      const [pushX, pushY] = resolveCirclePolygonCollision(newCenter, player.radius, obj.polygon);
      finalX += pushX;
      finalY += pushY;
    }
  }

  player.x = finalX;
  player.y = finalY;
}

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

