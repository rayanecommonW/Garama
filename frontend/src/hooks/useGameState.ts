"use client";
import { useMemo } from 'react';
import type { PlayerSnapshot } from './useGameSocket';

export type GameStateView = {
  me: PlayerSnapshot | null;
  others: PlayerSnapshot[];
  all: PlayerSnapshot[];
};

export default function useGameState(players: Map<string, PlayerSnapshot>, myId: string | null): GameStateView {
  return useMemo(() => {
    const list = Array.from(players.values());
    const me = myId ? players.get(myId) ?? null : null;
    const others = me ? list.filter((p) => p.id !== me.id) : list;
    return { me, others, all: list };
  }, [players, myId]);
}
