import type { ClientMessage, ServerMessage } from '@garama/shared';
import type { Socket } from 'socket.io-client';

import { GameState } from '../gameState';

type PongMessage = ServerMessage & { type: 'pong' };

type ClockSyncSample = {
  rttMs: number;
  offsetMs: number;
};

type ClockSyncConfig = {
  initialSamples?: number;
  initialPauseMs?: number;
  pingTimeoutMs?: number;
  maintenanceIntervalMs?: number;
  emaAlpha?: number;
  driftResyncThresholdMs?: number;
  rttSpikeResyncThresholdMs?: number;
};

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

function stdDev(values: number[]) {
  if (values.length <= 1) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function computeInterpDelayMs(smoothedRttMs: number) {
  const base = Math.max(100, smoothedRttMs * 0.5);
  return clamp(80, base, 150);
}

function filterOutlierSamples(samples: ClockSyncSample[]) {
  if (samples.length <= 2) return samples;
  const rtts = samples.map((s) => s.rttMs);
  const med = median(rtts);
  const sd = stdDev(rtts);
  const cutoff = med + sd;
  return samples.filter((s) => s.rttMs <= cutoff);
}

export function startClockSync(socket: Socket, config: ClockSyncConfig = {}) {
  const initialSamples = config.initialSamples ?? 8;
  const initialPauseMs = config.initialPauseMs ?? 300;
  const pingTimeoutMs = config.pingTimeoutMs ?? 1500;
  const maintenanceIntervalMs = config.maintenanceIntervalMs ?? 1000;
  const emaAlpha = config.emaAlpha ?? 0.12;
  const driftResyncThresholdMs = config.driftResyncThresholdMs ?? 80;
  const rttSpikeResyncThresholdMs = config.rttSpikeResyncThresholdMs ?? 180;

  let isStopped = false;
  let maintenanceTimer: number | null = null;
  let isResyncing = false;
  let pending:
    | {
        sentAt: number;
        resolve: (payload: { msg: PongMessage; recvAt: number }) => void;
        timeoutId: number;
      }
    | null = null;

  // Handle server pong messages and resolve the current outstanding ping.
  function handlePong(msg: PongMessage) {
    if (!pending) return;
    const recvAt = performance.now();
    const timeoutId = pending.timeoutId;
    const resolve = pending.resolve;
    pending = null;
    clearTimeout(timeoutId);
    resolve({ msg, recvAt });
  }

  // Stop sync, clear timers, and remove listeners.
  function stop() {
    isStopped = true;
    socket.off('pong', handlePong);
    if (maintenanceTimer !== null) {
      clearInterval(maintenanceTimer);
      maintenanceTimer = null;
    }
    if (pending) {
      clearTimeout(pending.timeoutId);
      pending = null;
    }
  }

  // Send a ping and wait for its pong response.
  function pingOnce(): Promise<ClockSyncSample | null> {
    if (isStopped) return Promise.resolve(null);
    if (pending) return Promise.resolve(null);

    const sentAt = performance.now();

    const pingMsg: ClientMessage & { type: 'ping' } = {
      type: 'ping',
      clientSendTime: sentAt,
    };

    socket.emit('ping', pingMsg);

    return new Promise((resolve) => {
      const timeoutId = window.setTimeout(() => {
        pending = null;
        resolve(null);
      }, pingTimeoutMs);

      pending = {
        sentAt,
        timeoutId,
        resolve: ({ msg, recvAt }) => {
          const rttMs = recvAt - sentAt;
          const estServerNow = msg.serverTime + rttMs / 2;
          const offsetMs = estServerNow - recvAt;
          resolve({ rttMs, offsetMs });
        },
      };
    });
  }

  // Run K-sample initial sync and set initial clock offset + smoothed RTT.
  async function runInitialSync() {
    const samples: ClockSyncSample[] = [];

    for (let i = 0; i < initialSamples && !isStopped; i++) {
      const sample = await pingOnce();
      if (sample) samples.push(sample);
      await sleep(initialPauseMs);
    }

    const filtered = filterOutlierSamples(samples);
    if (filtered.length === 0) return;

    GameState.net.clockOffsetMs = mean(filtered.map((s) => s.offsetMs));
    GameState.net.smoothedRttMs = mean(filtered.map((s) => s.rttMs));
    GameState.net.interpDelayMs = computeInterpDelayMs(GameState.net.smoothedRttMs);
  }

  // Apply a single maintenance sample with EMA smoothing; resync on large drift/spikes.
  async function runMaintenanceTick() {
    const sample = await pingOnce();
    if (!sample) return;

    const prevOffset = GameState.net.clockOffsetMs;
    const prevRtt = GameState.net.smoothedRttMs;

    if (!prevRtt) {
      GameState.net.clockOffsetMs = sample.offsetMs;
      GameState.net.smoothedRttMs = sample.rttMs;
      GameState.net.interpDelayMs = computeInterpDelayMs(sample.rttMs);
      return;
    }

    const driftMs = Math.abs(sample.offsetMs - prevOffset);
    const rttSpikeMs = sample.rttMs - prevRtt;

    GameState.net.clockOffsetMs = emaAlpha * sample.offsetMs + (1 - emaAlpha) * prevOffset;
    GameState.net.smoothedRttMs = emaAlpha * sample.rttMs + (1 - emaAlpha) * prevRtt;
    GameState.net.interpDelayMs = computeInterpDelayMs(GameState.net.smoothedRttMs);

    if (isResyncing) return;
    if (driftMs > driftResyncThresholdMs || rttSpikeMs > rttSpikeResyncThresholdMs) {
      isResyncing = true;
      await runInitialSync();
      isResyncing = false;
    }
  }

  socket.on('pong', handlePong);

  void (async () => {
    await runInitialSync();
    if (isStopped) return;
    maintenanceTimer = window.setInterval(() => {
      void runMaintenanceTick();
    }, maintenanceIntervalMs);
  })();

  return { stop };
}


