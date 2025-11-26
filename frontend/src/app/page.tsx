'use client';
import { useState } from 'react';

import GameSimple from '../components/GameSimple';
import Home from '../components/Home';
import { type KeyBindings, DEFAULT_KEY_BINDINGS } from '../game/input';

export default function Page() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(DEFAULT_KEY_BINDINGS);

  const handleStart = (name: string, bindings: KeyBindings) => {
    setPlayerName(name);
    setKeyBindings(bindings);
  };

  if (!playerName) {
    return <Home onStart={handleStart} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Garama — simple .io demo</h1>
        <GameSimple playerName={playerName} keyBindings={keyBindings} />
      </div>
    </div>
  );
}
