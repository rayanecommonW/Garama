"use client";
import { useState } from 'react';

type Props = { onStart: (name: string) => void };

export default function Home({ onStart }: Props) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onStart(trimmed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white/80 p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Enter your player name</h2>
        <input
          className="w-full border rounded px-3 py-2 mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoFocus
        />
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">
          Enter Game
        </button>
      </form>
    </div>
  );
}
