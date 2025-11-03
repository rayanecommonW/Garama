import { Server } from 'socket.io';
import type { ClientMessage, ServerMessage, PlayerData } from '@garama/shared';
import { TICK_RATE, PLAYER_COLOR, PLAYER_RADIUS, MAP_WIDTH, MAP_HEIGHT } from '@garama/shared';

// Server authoritative game state
const players = new Map<string, PlayerData>();
let serverTick = 0; // Server tick counter, increments at 20Hz

export const createServer = () => {
  const port = Number(process.env.PORT) || 3001;

  // Create Socket.IO server
  const io = new Server(port, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Handle client connections
  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle player join
    socket.on('join', (msg: ClientMessage & { type: 'join' }) => {
      const player: PlayerData = {
        id: socket.id,
        name: msg.name,
        x: 0,
        y: 0,
        color: PLAYER_COLOR,
      };
      players.set(socket.id, player);
      console.log(`Player ${msg.name} joined at (0, 0)`);
    });

    // Handle position updates
    socket.on('position', (msg: ClientMessage & { type: 'position' }) => {
      const player = players.get(socket.id);
      if (player) {
        // Update position with bounds checking
        player.x = Math.max(PLAYER_RADIUS, Math.min(MAP_WIDTH - PLAYER_RADIUS, msg.x));
        player.y = Math.max(PLAYER_RADIUS, Math.min(MAP_HEIGHT - PLAYER_RADIUS, msg.y));
      }
    });

    // Handle 'ok' messages from clients
    socket.on('ok', (msg: ClientMessage) => {
      console.log(`Received 'ok' from client ${socket.id}`);
    });

    // Handle chat messages from clients
    socket.on('chat', (msg: ClientMessage & { type: 'chat' }) => {
      console.log(`Chat from client ${socket.id}: "${msg.message}"`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      players.delete(socket.id);
    });
  });

  // Server tick at 20hz - send snapshots
  const tickInterval = setInterval(() => {
    const snapshot: ServerMessage = {
      type: 'snapshot',
      players: Array.from(players.values()),
      timestamp: Date.now(),
      serverTick: serverTick,
    };

    // Broadcast snapshot to all connected clients
    io.emit('snapshot', snapshot);
    
    // Increment server tick counter
    serverTick++;
  }, 1000 / TICK_RATE);

  console.log(`Socket.IO server listening on http://localhost:${port}`);

  return {
    io,
    tickInterval,
    port,
  };
};
