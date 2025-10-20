"use client";
import { useMemo } from 'react';
import type { PlayerSnapshot } from '../game/types';

export type GameStateView = {
  me: PlayerSnapshot | null;
  others: PlayerSnapshot[];
  all: PlayerSnapshot[];
};

export default function useGameState(players: PlayerSnapshot[], myId: string | null): GameStateView {
  return useMemo(() => {
    const me = myId ? players.find((p) => p.id === myId) ?? null : null;
    const others = me ? players.filter((p) => p.id !== me.id) : players;
    return { me, others, all: players };
  }, [players, myId]);
}
