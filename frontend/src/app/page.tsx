'use client';
import { useState } from 'react';

import GameSimple from '../components/GameSimple';
import Home from '../components/Home';
import TitleScreen from '../components/TitleScreen';
import { type KeyBindings, DEFAULT_KEY_BINDINGS } from '../game/input';

type Screen = 'title' | 'lobby' | 'game';

export default function Page() {
  const [screen, setScreen] = useState<Screen>('title');
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(DEFAULT_KEY_BINDINGS);

  const handleStartGame = (name: string, bindings: KeyBindings) => {
    setPlayerName(name);
    setKeyBindings(bindings);
    setScreen('game');
  };

  if (screen === 'title') {
    return <TitleScreen onStart={() => setScreen('lobby')} />;
  }

  if (screen === 'lobby' || !playerName) {
    return <Home onStart={handleStartGame} onBack={() => setScreen('title')} />;
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
