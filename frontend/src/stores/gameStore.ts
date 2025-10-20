import { create } from 'zustand';
import type { ConnectionStatus, PlayerSnapshot } from '../game/types';

type GameStoreState = {
  status: ConnectionStatus;
  lastError: string | null;
  myId: string | null;
  players: PlayerSnapshot[];
  setStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  setMyId: (id: string | null) => void;
  setPlayers: (players: PlayerSnapshot[]) => void;
  reset: () => void;
};

export const useGameStore = create<GameStoreState>((set) => ({
  status: 'idle',
  lastError: null,
  myId: null,
  players: [],
  setStatus: (status: ConnectionStatus) => set({ status }),
  setError: (lastError: string | null) => set({ lastError }),
  setMyId: (myId: string | null) => set({ myId }),
  setPlayers: (players: PlayerSnapshot[]) => set({ players }),
  reset: () => set({ status: 'idle', lastError: null, myId: null, players: [] }),
}));
