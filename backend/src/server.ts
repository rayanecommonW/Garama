import { Hono } from 'hono';
import type { ServerWebSocket } from 'bun';
import type { ClientMessage } from '@garama/shared';
import { TICK_RATE, INACTIVITY_TIMEOUT } from '@garama/shared';
import { WebSocketHandler } from './websocket.js';

export const createServer = () => {
  const app = new Hono();
  const wsHandler = new WebSocketHandler();

  app.get('/health', (c) => c.json({ ok: true }));
  app.get('/', (c) => c.text('Garama backend. Connect via WebSocket on /ws'));
  app.get('/api/info', (c) =>
    c.json({
      players: wsHandler.gameInstance.getPlayerCount(),
      sockets: 0, // TODO: expose from handler
      tickRate: TICK_RATE,
    })
  );

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
      open() {},

      message(ws, raw) {
        try {
          const msg: ClientMessage = JSON.parse(raw.toString());

          if (msg.type === 'join') {
            wsHandler.handleJoin(ws, msg);
          } else if (msg.type === 'input') {
            wsHandler.handleInput(ws, msg);
          }
        } catch {}
      },

      close(ws) {
        wsHandler.handleDisconnect(ws);
      },
    },
  });

  // Game loop
  setInterval(() => {
    if (wsHandler.gameInstance.getPlayerCount() === 0) return;

    wsHandler.gameInstance.removeInactivePlayers(INACTIVITY_TIMEOUT);
    wsHandler.cleanupInactiveSockets(INACTIVITY_TIMEOUT);

    const movedPlayers = wsHandler.gameInstance.updatePositions();
    if (movedPlayers > 0) {
      wsHandler.broadcastGameState();
    }
  }, 1000 / TICK_RATE);

  console.log(`Garama backend listening on http://localhost:${server.port}`);

  return server;
};
