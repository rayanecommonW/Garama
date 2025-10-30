import type { PlayerState, Direction } from '@garama/shared';
import { WORLD_WIDTH, WORLD_HEIGHT, PLAYER_SPEED } from '@garama/shared';
import { clamp } from './utils.js';

export class Game {
  private players = new Map<string, PlayerState>();

  getPlayer(id: string): PlayerState | undefined {
    return this.players.get(id);
  }

  addPlayer(player: PlayerState): void {
    this.players.set(player.id, player);
  }

  removePlayer(id: string): PlayerState | undefined {
    const player = this.players.get(id);
    if (player) this.players.delete(id);
    return player;
  }

  getPlayers(): PlayerState[] {
    return Array.from(this.players.values());
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  updatePlayerMovement(player: PlayerState, direction: Direction): void {
    const oldVx = player.vx;
    const oldVy = player.vy;

    switch (direction) {
      case 'up': player.vx = 0; player.vy = -PLAYER_SPEED; break;
      case 'down': player.vx = 0; player.vy = PLAYER_SPEED; break;
      case 'left': player.vx = -PLAYER_SPEED; player.vy = 0; break;
      case 'right': player.vx = PLAYER_SPEED; player.vy = 0; break;
      case 'stop': player.vx = 0; player.vy = 0; break;
    }
  }

  updatePositions(): number {
    let movedCount = 0;

    for (const player of this.players.values()) {
      const oldX = player.x;
      const oldY = player.y;
      player.x = clamp(player.x + player.vx, 0, WORLD_WIDTH);
      player.y = clamp(player.y + player.vy, 0, WORLD_HEIGHT);

      if (player.x !== oldX || player.y !== oldY) movedCount++;
    }

    return movedCount;
  }

  removeInactivePlayers(timeoutMs: number): void {
    const now = Date.now();
    for (const [id, player] of this.players) {
      if (now - player.lastSeen > timeoutMs) {
        this.players.delete(id);
      }
    }
  }

  getPlayerSnapshots() {
    return this.getPlayers().map(p => ({
      id: p.id,
      name: p.name,
      x: p.x,
      y: p.y,
      color: p.color,
      vx: p.vx,
      vy: p.vy,
    }));
  }
}
