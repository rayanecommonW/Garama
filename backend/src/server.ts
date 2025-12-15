import { CHARGE_HOLD_MS, SCORE_PER_KILL, TICK_RATE, STATIC_OBJECTS, type ClientMessage, type ServerMessage } from '@garama/shared';
import { Server } from 'socket.io';

import { canStartAttack, resolveAttack } from './combat';
import { createPlayer, handlePositionUpdate, players } from './players';

let serverTick = 0;
const ROOM_ID = 'match';

function getServerTimeMs() {
  // Return monotonic server time in ms (relative to process start).
  return process.uptime() * 1000;
}

export const createServer = () => {
  const port = Number(process.env.PORT) || 3001;

  const io = new Server(port, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.info(`Client connected: ${socket.id}`);

    socket.on('join', (msg: ClientMessage & { type: 'join' }) => {
      socket.join(ROOM_ID);
      const player = createPlayer(socket.id, msg.name);
      players.set(socket.id, player);
      console.info(`Player ${msg.name} joined at (0, 0)`);
    });

    socket.on('position', (msg: ClientMessage & { type: 'position' }) => {
      const player = players.get(socket.id);
      if (player) handlePositionUpdate(player, msg, STATIC_OBJECTS);
    });

    socket.on('attack_hold_start', (_msg: ClientMessage & { type: 'attack_hold_start' }) => {
      const attacker = players.get(socket.id);
      if (!attacker || attacker.isDead) return;

      attacker.attackHoldStartedAtMs = getServerTimeMs();
    });

    socket.on('attack_release', (msg: ClientMessage & { type: 'attack_release' }) => {
      const attacker = players.get(socket.id);
      if (!attacker || attacker.isDead) return;

      const serverNowMs = getServerTimeMs();
      const holdStartedAtMs = attacker.attackHoldStartedAtMs;
      attacker.attackHoldStartedAtMs = null;

      const holdMs = holdStartedAtMs === null ? 0 : serverNowMs - holdStartedAtMs;
      const isCharged = holdMs >= CHARGE_HOLD_MS;

      if (!canStartAttack(attacker, msg.direction, msg.isAirborne)) return;

      io.emit('attack_vfx', {
        type: 'attack_vfx',
        attackerId: attacker.id,
        direction: msg.direction,
        isCharged,
      });

      const hits = resolveAttack(attacker, msg.direction, msg.isAirborne, players, isCharged);

      hits.forEach(({ targetId, nextHp, isKill }) => {
        const target = players.get(targetId);
        if (!target) return;
        target.hp = nextHp;
        if (isKill) {
          attacker.score += SCORE_PER_KILL;
          target.isDead = true;
          io.emit('death', { type: 'death', targetId });
        }
        io.emit('damage', { type: 'damage', targetId, hp: target.hp });
      });
    });

    socket.on('attack_start', (msg: ClientMessage & { type: 'attack_start' }) => {
      const attacker = players.get(socket.id);
      if (!attacker || attacker.isDead) return;

      const hits = resolveAttack(attacker, msg.direction, msg.isAirborne, players);

      hits.forEach(({ targetId, nextHp, isKill }) => {
        const target = players.get(targetId);
        if (!target) return;
        target.hp = nextHp;
        if (isKill) {
          attacker.score += SCORE_PER_KILL;
          target.isDead = true;
          io.emit('death', { type: 'death', targetId });
        }
        io.emit('damage', { type: 'damage', targetId, hp: target.hp });
      });
    });

    socket.on('ping', (msg: ClientMessage & { type: 'ping' }) => {
      socket.emit('pong', {
        type: 'pong',
        clientSendTime: msg.clientSendTime,
        serverTime: getServerTimeMs(),
        serverTick,
      });
    });

    socket.on('ok', (_msg: ClientMessage) => {
      console.info(`Received 'ok' from client ${socket.id}`);
    });

    socket.on('chat', (msg: ClientMessage & { type: 'chat' }) => {
      const text = msg.message.trim().slice(0, 120);
      if (!text) return;

      console.info(`Chat from client ${socket.id}: "${text}"`);
      socket.to(ROOM_ID).emit('chat', { type: 'chat', message: text, from: socket.id });
    });

    socket.on('disconnect', () => {
      console.info(`Client disconnected: ${socket.id}`);
      players.delete(socket.id);
    });
  });

  const tickInterval = setInterval(() => {
    const serverTime = getServerTimeMs();
    const snapshot: ServerMessage = {
      type: 'snapshot',
      players: Array.from(players.values()).map(({ id, name, x, y, color, hp, score, isDead, attackHoldStartedAtMs }) => ({
        id,
        name,
        x,
        y,
        color,
        hp,
        score,
        isDead,
        attackHoldStartedAtServerTime: attackHoldStartedAtMs,
        isCharging:
          !isDead &&
          attackHoldStartedAtMs !== null &&
          serverTime - attackHoldStartedAtMs >= CHARGE_HOLD_MS,
      })),
      timestamp: Date.now(),
      serverTime,
      serverTick,
    };

    io.emit('snapshot', snapshot);

    serverTick++;
  }, 1000 / TICK_RATE);

  console.info(`Socket.IO server listening on http://localhost:${port}`);

  return {
    io,
    tickInterval,
    port,
  };
};
