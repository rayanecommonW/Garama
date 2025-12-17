'use client';
import { useEffect, useState } from 'react';

import { GameState } from '../game/gameState';

type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  isLocal: boolean;
};

function buildLeaderboard(): LeaderboardEntry[] {
  const localPlayerId = GameState.localPlayerId;
  const entries: LeaderboardEntry[] = [];

  GameState.players.forEach((player) => {
    if (player.isDead) return;
    entries.push({
      id: player.id,
      name: player.name,
      score: player.score,
      isLocal: player.id === localPlayerId,
    });
  });

  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName;
    return a.id.localeCompare(b.id);
  });

  return entries;
}

type Props = {
  className?: string;
};

export default function Leaderboard({ className = '' }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => buildLeaderboard());

  useEffect(() => {
    const interval = setInterval(() => {
      setEntries(buildLeaderboard());
    }, 250);

    return () => clearInterval(interval);
  }, []);

  if (entries.length === 0) return null;

  return (
    <div
      className={`w-56 rounded border border-[#1f3b2b]/80 bg-[#020b06]/75 p-3 text-sm text-[#e7fdf5]/90 shadow-lg backdrop-blur-sm ${className}`}
    >
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-[#7bb59a] uppercase">Leaderboard</h3>
      <div className="space-y-1">
        {entries.map((entry, index) => {
          const nameClassName = entry.isLocal ? 'font-semibold text-green-400' : 'text-[#e7fdf5]/90';
          return (
            <div key={entry.id} className="flex items-center justify-between gap-3">
              <span className={`min-w-0 flex-1 truncate ${nameClassName}`}>
                {index + 1}. {entry.name}
              </span>
              <span className="shrink-0 text-[#c9f4e2]/70">{entry.score} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


