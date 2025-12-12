import { GameState } from '../gameState';

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function estimateServerNowMs(clientNowMs: number) {
  if (GameState.net.smoothedRttMs > 0) {
    return clientNowMs + GameState.net.clockOffsetMs;
  }
  if (GameState.net.lastSnapshotServerTime === null || GameState.net.lastSnapshotClientRecvMs === null) {
    return null;
  }
  return GameState.net.lastSnapshotServerTime + (clientNowMs - GameState.net.lastSnapshotClientRecvMs);
}

export function interpolateRemotePlayers(clientNowMs: number) {
  if (!GameState.localPlayerId) return;

  const estimatedServerNow = estimateServerNowMs(clientNowMs);
  if (estimatedServerNow === null) return;

  const targetServerRenderTime = estimatedServerNow - GameState.net.interpDelayMs;
  const maxExtrapolationMs = 150;

  GameState.players.forEach((player, id) => {
    if (id === GameState.localPlayerId) return;

    const samples = GameState.net.remoteSnapshots.get(id);
    if (!samples || samples.length === 0) return;

    while (samples.length >= 3 && (samples[1]?.serverTime ?? Infinity) <= targetServerRenderTime) {
      samples.shift();
    }

    const s0 = samples[0];
    const s1 = samples[1];
    if (!s0) return;

    let nextX = s0.x;
    let nextY = s0.y;

    if (s1 && s0.serverTime <= targetServerRenderTime && targetServerRenderTime <= s1.serverTime) {
      const dt = s1.serverTime - s0.serverTime;
      const t = dt > 0 ? clamp(0, (targetServerRenderTime - s0.serverTime) / dt, 1) : 0;
      nextX = lerp(s0.x, s1.x, t);
      nextY = lerp(s0.y, s1.y, t);
    } else {
      const last = samples[samples.length - 1];
      const prev = samples[samples.length - 2];
      if (last && prev && targetServerRenderTime > last.serverTime) {
        const dt = last.serverTime - prev.serverTime;
        if (dt > 0) {
          const aheadMs = clamp(0, targetServerRenderTime - last.serverTime, maxExtrapolationMs);
          const vx = (last.x - prev.x) / dt;
          const vy = (last.y - prev.y) / dt;
          nextX = last.x + vx * aheadMs;
          nextY = last.y + vy * aheadMs;
        } else {
          nextX = last.x;
          nextY = last.y;
        }
      } else if (last) {
        nextX = last.x;
        nextY = last.y;
      }
    }

    player.x = nextX;
    player.y = nextY;
  });
}


