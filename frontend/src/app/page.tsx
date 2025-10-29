"use client";
import { useState } from 'react';
import Home from '../components/Home';
import GameSimple from '../components/GameSimple';

export default function Page() {
  const [playerName, setPlayerName] = useState<string | null>(null);

  if (!playerName) {
    return <Home onStart={setPlayerName} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Garama — simple .io demo</h1>
        <GameSimple playerName={playerName} />
      </div>
    </div>
  );
}
