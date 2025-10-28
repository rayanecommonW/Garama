// backend/index.ts
// Authoritative multiplayer server built with Bun + Hono using WebSockets.

import { Hono } from 'hono';
import type { ServerWebSocket } from 'bun';
import type {
  PlayerState,
  Direction,
  ClientMessage
} from '@garama/shared';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  TICK_RATE,
  PLAYER_SPEED,
  INACTIVITY_TIMEOUT
} from '@garama/shared';

type GameSocket = ServerWebSocket<undefined>;

const players = new Map<string, PlayerState>();
const sockets = new Map<string, GameSocket>();
const socketOwners = new WeakMap<GameSocket, string>();

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true }));
app.get('/', (c) => c.text('Garama backend. Connect via WebSocket on /ws'));
app.get('/api/info', (c) =>
  c.json({
    players: players.size,
    sockets: sockets.size,
    tickRate: TICK_RATE,
  })
);

function randomColor(): string {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
}

function nextPlayerId(): string {
  return `player-${Math.random().toString(36).slice(2, 11)}`;
}

function sanitizeName(input?: unknown): string {
  if (typeof input !== 'string') return 'Anonymous';
  const trimmed = input.trim();
  if (!trimmed) return 'Anonymous';
  return trimmed.slice(0, 24);
}

function resolveClientId(clientId?: unknown): string | undefined {
  if (typeof clientId !== 'string') return undefined;
  const trimmed = clientId.trim();
  if (!trimmed.startsWith('player-')) return undefined;
  return trimmed;
}

function spawnPlayer(id: string, name: string): PlayerState {
  return {
    id,
    name,
    x: WORLD_WIDTH / 2 + (Math.random() - 0.5) * 200,
    y: WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 200,
    color: randomColor(),
    vx: 0,
    vy: 0,
    lastSeen: Date.now(),
  };
}

function applyDirection(player: PlayerState, direction: Direction) {
  switch (direction) {
    case 'up':
      player.vx = 0;
      player.vy = -PLAYER_SPEED;
      break;
    case 'down':
      player.vx = 0;
      player.vy = PLAYER_SPEED;
      break;
    case 'left':
      player.vx = -PLAYER_SPEED;
      player.vy = 0;
      break;
    case 'right':
      player.vx = PLAYER_SPEED;
      player.vy = 0;
      break;
    default:
      player.vx = 0;
      player.vy = 0;
      break;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function snapshotPlayers() {
  return Array.from(players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    x: p.x,
    y: p.y,
    color: p.color,
    vx: p.vx,
    vy: p.vy,
  }));
}

function broadcastGameState() {
  if (players.size === 0 || sockets.size === 0) return;
  const payload = JSON.stringify({ type: 'gameState', players: snapshotPlayers() });
  for (const ws of sockets.values()) {
    try {
      ws.send(payload);
    } catch {
      // Ignore failed sends; socket cleanup happens on close
    }
  }
}

const server = Bun.serve({
  port: Number(process.env.PORT) || 3001,

  async fetch(request, server) {
    const { pathname } = new URL(request.url);
    if (pathname === '/ws') {
      if (server.upgrade(request)) return;
      return new Response('WebSocket upgrade failed', { status: 426 });
    }
    return app.fetch(request);
  },

  websocket: {
    open(ws) {
      console.log('🔌 WebSocket connected (awaiting join)');
    },

    message(ws, raw) {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch (err) {
        console.error('⚠️ Invalid JSON message', err);
        return;
      }

      if (msg.type === 'join') {
        const requestedId = resolveClientId(msg.clientId);
        const playerId = requestedId ?? nextPlayerId();
        const playerName = sanitizeName(msg.name);

        let player = players.get(playerId);
        if (!player) {
          player = spawnPlayer(playerId, playerName);
          players.set(playerId, player);
          console.log(`🎮 Player created ${playerId} (${playerName}) total=${players.size}`);
        } else {
          player.name = playerName;
          player.vx = 0;
          player.vy = 0;
          player.lastSeen = Date.now();
          console.log(`♻️ Player reconnected ${playerId} (${playerName})`);
        }

        const previousSocket = sockets.get(playerId);
        if (previousSocket && previousSocket !== ws) {
          socketOwners.delete(previousSocket);
          sockets.delete(playerId);
          try {
            previousSocket.close(4000, 'Replaced by new connection');
          } catch {
            /* ignore */
          }
        }

        sockets.set(playerId, ws);
        socketOwners.set(ws, playerId);

        const welcome = {
          type: 'welcome' as const,
          myId: playerId,
          player,
        };
        ws.send(JSON.stringify(welcome));

        // Send initial snapshot immediately so client can render without waiting for next tick
        ws.send(JSON.stringify({ type: 'gameState', players: snapshotPlayers() }));
        return;
      }

      if (msg.type === 'input') {
        const playerId = socketOwners.get(ws);
        if (!playerId) return;

        const player = players.get(playerId);
        if (!player) return;

        const direction = msg.direction;
        switch (direction) {
          case 'up':
          case 'down':
          case 'left':
          case 'right':
          case 'stop':
            applyDirection(player, direction);
            player.lastSeen = Date.now();
            break;
          default:
            break;
        }
        return;
      }
    },

    close(ws) {
      const playerId = socketOwners.get(ws);
      if (!playerId) return;

      socketOwners.delete(ws);

      const ownedSocket = sockets.get(playerId);
      if (ownedSocket === ws) {
        sockets.delete(playerId);
        const player = players.get(playerId);
        if (player) {
          players.delete(playerId);
          console.log(`👋 Player disconnected ${playerId} (${player.name}) total=${players.size}`);
        }
      }
    },
  },
});

setInterval(() => {
  if (players.size === 0) return;

  const now = Date.now();

  for (const player of players.values()) {
    if (now - player.lastSeen > INACTIVITY_TIMEOUT) {
      players.delete(player.id);
      const socket = sockets.get(player.id);
      if (socket) {
        sockets.delete(player.id);
        socketOwners.delete(socket);
        try {
          socket.close(4001, 'Inactive');
        } catch {
          /* ignore */
        }
      }
      console.log(`⏲️ Removed inactive player ${player.id}`);
      continue;
    }

    player.x = clamp(player.x + player.vx, 0, WORLD_WIDTH);
    player.y = clamp(player.y + player.vy, 0, WORLD_HEIGHT);
    player.lastSeen = now;
  }

  broadcastGameState();
}, 1000 / TICK_RATE);

console.log(`Garama backend listening on http://localhost:${server.port}`);
console.log(`WebSocket endpoint: ws://localhost:${server.port}/ws`);
console.log(`Tick rate: ${TICK_RATE} Hz`);
