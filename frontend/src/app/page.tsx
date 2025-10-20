"use client";
import { useState } from 'react';
import Home from '../components/Home';
import GameSimple from '../components/GameSimple';

export default function Page() {
  const [name, setName] = useState<string | null>(null);

  if (!name) return <Home onStart={(n) => setName(n)} />;

  // expose name to the socket hook so it can register with the server immediately on open
  if (typeof window !== 'undefined') {
    try { (window as any).__GARAMA_PLAYER_NAME = name; } catch (e) { /* ignore */ }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Garama — simple .io demo</h1>
        <GameSimple playerName={name} />
      </div>
    </div>
  );
}
