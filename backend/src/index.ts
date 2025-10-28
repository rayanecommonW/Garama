import { Hono } from 'hono';
import type { ServerWebSocket } from 'bun';
import type { PlayerState, Direction, ClientMessage } from '@garama/shared';
import { WORLD_WIDTH, WORLD_HEIGHT, TICK_RATE, PLAYER_SPEED, INACTIVITY_TIMEOUT } from '@garama/shared';

const players = new Map<string, PlayerState>();
const sockets = new Map<string, GameSocket>();
const socketOwners = new WeakMap<GameSocket, string>();

type GameSocket = ServerWebSocket<undefined>;

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

// Utility functions
function randomColor(): string {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
}

function generatePlayerId(): string {
  return `player-${Math.random().toString(36).slice(2, 11)}`;
}

function sanitizeName(input: unknown): string {
  return typeof input === 'string' && input.trim()
    ? input.trim().slice(0, 24)
    : 'Anonymous';
}

function createPlayer(id: string, name: string): PlayerState {
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

function updatePlayerMovement(player: PlayerState, direction: Direction) {
  switch (direction) {
    case 'up': player.vx = 0; player.vy = -PLAYER_SPEED; break;
    case 'down': player.vx = 0; player.vy = PLAYER_SPEED; break;
    case 'left': player.vx = -PLAYER_SPEED; player.vy = 0; break;
    case 'right': player.vx = PLAYER_SPEED; player.vy = 0; break;
    case 'stop': player.vx = 0; player.vy = 0; break;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getPlayerSnapshots() {
  return Array.from(players.values()).map(p => ({
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

  const payload = JSON.stringify({
    type: 'gameState',
    players: getPlayerSnapshots()
  });

  for (const ws of sockets.values()) {
    try {
      ws.send(payload);
    } catch {
      // Socket cleanup happens on close
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
      console.log('🔌 WebSocket connected');
    },

    message(ws, raw) {
      try {
        const msg: ClientMessage = JSON.parse(raw.toString());

        if (msg.type === 'join') {
          handleJoin(ws, msg);
        } else if (msg.type === 'input') {
          handleInput(ws, msg);
        }
      } catch (err) {
        console.error('⚠️ Invalid message:', err);
      }
    },

    close(ws) {
      handleDisconnect(ws);
    },
  },
});

function handleJoin(ws: GameSocket, msg: ClientMessage & { type: 'join' }) {
  const playerId = msg.clientId && typeof msg.clientId === 'string' && msg.clientId.startsWith('player-')
    ? msg.clientId
    : generatePlayerId();

  const playerName = sanitizeName(msg.name);

  let player = players.get(playerId);
  if (!player) {
    player = createPlayer(playerId, playerName);
    players.set(playerId, player);
    console.log(`🎮 Player joined: ${playerId} (${playerName})`);
  } else {
    player.name = playerName;
    player.vx = 0;
    player.vy = 0;
    player.lastSeen = Date.now();
    console.log(`♻️ Player reconnected: ${playerId} (${playerName})`);
  }

  // Handle socket replacement
  const existingSocket = sockets.get(playerId);
  if (existingSocket && existingSocket !== ws) {
    socketOwners.delete(existingSocket);
    sockets.delete(playerId);
    existingSocket.close(4000, 'Replaced by new connection');
  }

  sockets.set(playerId, ws);
  socketOwners.set(ws, playerId);

  // Send welcome message and initial state
  ws.send(JSON.stringify({
    type: 'welcome',
    myId: playerId,
    player
  }));

  ws.send(JSON.stringify({
    type: 'gameState',
    players: getPlayerSnapshots()
  }));
}

function handleInput(ws: GameSocket, msg: ClientMessage & { type: 'input' }) {
  const playerId = socketOwners.get(ws);
  if (!playerId) return;

  const player = players.get(playerId);
  if (!player) return;

  if (msg.direction && typeof msg.direction === 'string') {
    updatePlayerMovement(player, msg.direction as Direction);
    player.lastSeen = Date.now();
  }
}

function handleDisconnect(ws: GameSocket) {
  const playerId = socketOwners.get(ws);
  if (!playerId) return;

  socketOwners.delete(ws);
  sockets.delete(playerId);

  const player = players.get(playerId);
  if (player) {
    players.delete(playerId);
    console.log(`👋 Player left: ${playerId} (${player.name})`);
  }
}

// Game loop - runs at TICK_RATE Hz
setInterval(() => {
  if (players.size === 0) return;

  const now = Date.now();

  // Update player positions and handle inactive players
  for (const [playerId, player] of players) {
    // Remove inactive players
    if (now - player.lastSeen > INACTIVITY_TIMEOUT) {
      players.delete(playerId);
      const socket = sockets.get(playerId);
      if (socket) {
        sockets.delete(playerId);
        socketOwners.delete(socket);
        socket.close(4001, 'Inactive');
      }
      console.log(`⏲️ Removed inactive player: ${playerId}`);
      continue;
    }

    // Update position based on velocity
    player.x = clamp(player.x + player.vx, 0, WORLD_WIDTH);
    player.y = clamp(player.y + player.vy, 0, WORLD_HEIGHT);
  }

  // Broadcast updated game state to all connected players
  broadcastGameState();
}, 1000 / TICK_RATE);

console.log(`Garama backend listening on http://localhost:${server.port}`);
console.log(`WebSocket endpoint: ws://localhost:${server.port}/ws`);
console.log(`Tick rate: ${TICK_RATE} Hz`);
