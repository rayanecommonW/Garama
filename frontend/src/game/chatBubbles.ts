import { GameState, type PlayerChatState } from './gameState';

export const CHAT_BUBBLE_MAX_VISIBLE = 3;
export const CHAT_BUBBLE_HOLD_MS = 1000;
export const CHAT_BUBBLE_LIFE_MS = 4000;
export const CHAT_BUBBLE_DEQUEUE_MS = 200;
export const CHAT_BUBBLE_FLOAT_PX = 100;

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeChatText(text: string) {
  // Normalize incoming chat text (trim + cap length) before enqueueing.
  return text.trim().slice(0, 120);
}

function getOrCreatePlayerChatState(playerId: string, nowMs: number): PlayerChatState {
  // Get (or create) the per-player chat state (queue + visible bubbles).
  const existing = GameState.chat.get(playerId);
  if (existing) return existing;

  const state: PlayerChatState = {
    queue: [],
    visible: [],
    nextDequeueAtMs: nowMs,
    idCounter: 0,
  };
  GameState.chat.set(playerId, state);
  return state;
}

function expireVisibleBubbles(state: PlayerChatState, nowMs: number) {
  // Remove expired visible bubbles from the front/back (max visible is small).
  if (state.visible.length === 0) return;
  state.visible = state.visible.filter((m) => nowMs - m.shownAtMs < CHAT_BUBBLE_LIFE_MS);
}

function dequeueAvailable(state: PlayerChatState, nowMs: number) {
  // Move messages from queue -> visible at a fixed cadence, capped by max visible.
  while (
    state.visible.length < CHAT_BUBBLE_MAX_VISIBLE &&
    state.queue.length > 0 &&
    nowMs >= state.nextDequeueAtMs
  ) {
    const next = state.queue.shift();
    if (!next) break;

    state.visible.push({
      id: next.id,
      text: next.text,
      shownAtMs: nowMs,
    });

    // Schedule the next message to appear after the dequeue delay.
    state.nextDequeueAtMs = nowMs + CHAT_BUBBLE_DEQUEUE_MS;
  }
}

export function enqueueChatMessage(playerId: string, text: string, nowMs: number) {
  // Enqueue a message for a player; it will appear above them via dequeue cadence.
  const normalized = normalizeChatText(text);
  if (!normalized) return;

  const state = getOrCreatePlayerChatState(playerId, nowMs);
  const id = state.idCounter++;

  state.queue.push({
    id,
    text: normalized,
    enqueuedAtMs: nowMs,
  });

  // Keep the queue bounded to avoid unbounded growth on spam.
  const maxQueued = 30;
  if (state.queue.length > maxQueued) {
    state.queue.splice(0, state.queue.length - maxQueued);
  }

  // Try to dequeue immediately (gives instant feedback on send when possible).
  dequeueAvailable(state, nowMs);
}

export function updateChatBubbles(nowMs: number) {
  // Update all chat bubble states: expire old bubbles + dequeue queued messages.
  GameState.chat.forEach((state, playerId) => {
    expireVisibleBubbles(state, nowMs);
    dequeueAvailable(state, nowMs);

    if (state.queue.length === 0 && state.visible.length === 0) {
      GameState.chat.delete(playerId);
    }

    // Prevent the dequeue timer from going wildly out of range after long pauses.
    state.nextDequeueAtMs = clamp(nowMs - 1000, state.nextDequeueAtMs, nowMs + 60_000);
  });
}

export function clearPlayerChat(playerId: string) {
  // Remove all chat bubbles (visible + queued) for a player.
  GameState.chat.delete(playerId);
}


