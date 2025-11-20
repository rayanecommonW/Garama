import { Server } from 'socket.io';
import type { ClientMessage, ServerMessage, PlayerData, Point } from '@garama/shared';
import { TICK_RATE, PLAYER_COLOR, PLAYER_RADIUS, MAP_WIDTH, MAP_HEIGHT, STATIC_OBJECTS } from '@garama/shared';
import { circlePolygonCollision, resolveCirclePolygonCollision } from '@garama/shared';

const players = new Map<string, PlayerData>();
let serverTick = 0;

export const createServer = () => {
  const port = Number(process.env.PORT) || 3001;

  const io = new Server(port, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

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

    socket.on('position', (msg: ClientMessage & { type: 'position' }) => {
      const player = players.get(socket.id);
      if (player) {
        let newX = Math.max(PLAYER_RADIUS, Math.min(MAP_WIDTH - PLAYER_RADIUS, msg.x));
        let newY = Math.max(PLAYER_RADIUS, Math.min(MAP_HEIGHT - PLAYER_RADIUS, msg.y));

        let finalX = newX;
        let finalY = newY;

        for (const obj of STATIC_OBJECTS) {
          const newCenter: Point = [finalX, finalY];
          
          if (circlePolygonCollision(newCenter, PLAYER_RADIUS, obj.polygon)) {
            const [pushX, pushY] = resolveCirclePolygonCollision(newCenter, PLAYER_RADIUS, obj.polygon);
            finalX += pushX;
            finalY += pushY;
          }
        }

        player.x = finalX;
        player.y = finalY;
      }
    });

    socket.on('ok', (msg: ClientMessage) => {
      console.log(`Received 'ok' from client ${socket.id}`);
    });

    socket.on('chat', (msg: ClientMessage & { type: 'chat' }) => {
      console.log(`Chat from client ${socket.id}: "${msg.message}"`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      players.delete(socket.id);
    });
  });

  const tickInterval = setInterval(() => {
    const snapshot: ServerMessage = {
      type: 'snapshot',
      players: Array.from(players.values()),
      timestamp: Date.now(),
      serverTick: serverTick,
    };

    io.emit('snapshot', snapshot);
    
    serverTick++;
  }, 1000 / TICK_RATE);

  console.log(`Socket.IO server listening on http://localhost:${port}`);

  return {
    io,
    tickInterval,
    port,
  };
};
