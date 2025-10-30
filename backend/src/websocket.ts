import type { ServerWebSocket } from 'bun';
import type { ClientMessage, PlayerState, Direction } from '@garama/shared';
import { Game } from './game.js';
import { createPlayer, sanitizeName, generatePlayerId } from './utils.js';

type GameSocket = ServerWebSocket<undefined>;

export class WebSocketHandler {
  private game = new Game();
  private sockets = new Map<string, GameSocket>();
  private socketOwners = new WeakMap<GameSocket, string>();

  handleJoin(ws: GameSocket, msg: ClientMessage & { type: 'join' }): void {
    const playerId = msg.clientId && typeof msg.clientId === 'string' && msg.clientId.startsWith('player-')
      ? msg.clientId
      : generatePlayerId();

    const playerName = sanitizeName(msg.name);
    let player = this.game.getPlayer(playerId);

    if (!player) {
      player = createPlayer(playerId, playerName);
      this.game.addPlayer(player);
    } else {
      player.name = playerName;
      player.vx = 0;
      player.vy = 0;
      player.lastSeen = Date.now();
    }

    this.replaceSocket(playerId, ws);
    this.sockets.set(playerId, ws);
    this.socketOwners.set(ws, playerId);

    ws.send(JSON.stringify({ type: 'welcome', myId: playerId, player }));
    ws.send(JSON.stringify({ type: 'gameState', players: this.game.getPlayerSnapshots() }));
  }

  handleInput(ws: GameSocket, msg: ClientMessage & { type: 'input' }): void {
    const playerId = this.socketOwners.get(ws);
    if (!playerId) return;

    const player = this.game.getPlayer(playerId);
    if (!player) return;

    const validDirections = ['up', 'down', 'left', 'right', 'stop'];
    if (msg.direction && typeof msg.direction === 'string' && validDirections.includes(msg.direction)) {
      this.game.updatePlayerMovement(player, msg.direction as Direction);
      player.lastSeen = Date.now();
    }
  }

  handleDisconnect(ws: GameSocket): void {
    const playerId = this.socketOwners.get(ws);
    if (!playerId) return;

    this.socketOwners.delete(ws);
    this.sockets.delete(playerId);
    this.game.removePlayer(playerId);
  }

  private replaceSocket(playerId: string, newWs: GameSocket): void {
    const existing = this.sockets.get(playerId);
    if (existing && existing !== newWs) {
      this.socketOwners.delete(existing);
      this.sockets.delete(playerId);
      existing.close(4000, 'Replaced by new connection');
    }
  }

  broadcastGameState(): void {
    if (this.game.getPlayerCount() === 0 || this.sockets.size === 0) return;

    const payload = JSON.stringify({
      type: 'gameState',
      players: this.game.getPlayerSnapshots()
    });

    for (const ws of this.sockets.values()) {
      try {
        ws.send(payload);
      } catch {}
    }
  }

  cleanupInactiveSockets(timeoutMs: number): void {
    const now = Date.now();
    for (const player of this.game.getPlayers()) {
      if (now - player.lastSeen > timeoutMs) {
        const socket = this.sockets.get(player.id);
        if (socket) {
          this.sockets.delete(player.id);
          this.socketOwners.delete(socket);
          socket.close(4001, 'Inactive');
        }
      }
    }
  }

  get gameInstance(): Game {
    return this.game;
  }
}
