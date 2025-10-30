import { Server } from 'socket.io';
import type { ClientMessage, ServerMessage } from '@garama/shared';
import { TICK_RATE } from '@garama/shared';

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

    // Handle 'ok' messages from clients
    socket.on('ok', (msg: ClientMessage) => {
      // Simply acknowledge receipt of 'ok' message
      console.log(`Received 'ok' from client ${socket.id}`);
    });

    // Handle chat messages from clients
    socket.on('chat', (msg: ClientMessage & { type: 'chat' }) => {
      console.log(`Chat from client ${socket.id}: "${msg.message}"`);
      // Only log on server, no broadcasting to other clients
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Server tick at 20hz
  const tickInterval = setInterval(() => {
    const tickMessage: ServerMessage = {
      type: 'tick',
      timestamp: Date.now(),
    };

    // Broadcast tick to all connected clients
    io.emit('tick', tickMessage);
  }, 1000 / TICK_RATE);

  console.log(`Socket.IO server listening on http://localhost:${port}`);

  return {
    io,
    tickInterval,
    port,
  };
};
