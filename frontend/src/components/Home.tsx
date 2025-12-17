'use client';
import { useState } from 'react';

import { DEFAULT_KEY_BINDINGS, type KeyBindings } from '../game/input';

type Props = { onStart: (name: string, keyMap: KeyBindings) => void };

export default function Home({ onStart }: Props) {
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(DEFAULT_KEY_BINDINGS);
  const [showSettings, setShowSettings] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onStart(trimmed, keyBindings);
  };

  const handleKeyChange = (action: keyof KeyBindings, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(-1).toLowerCase();
    setKeyBindings((prev) => ({ ...prev, [action]: val }));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020b06] font-sans">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-10 left-10 h-32 w-32 animate-pulse rounded-full bg-emerald-400 blur-3xl" />
        <div className="absolute right-20 bottom-20 h-48 w-48 animate-pulse rounded-full bg-lime-300 blur-3xl delay-1000" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="mb-12 text-center">
          <h1 className="mb-2 transform bg-linear-to-r from-[#c9f4e2] to-[#7bb59a] bg-clip-text text-6xl font-black tracking-tight text-transparent drop-shadow-lg transition-transform duration-300 hover:scale-105">
            WORK IN PROGRESS
          </h1>
          <p className="text-lg font-medium tracking-wide text-[#7bb59a] uppercase">
            Multiplayer Arena
          </p>
        </div>

        <div className="transform rounded-2xl border border-[#1f3b2b]/70 bg-[#020b06]/70 p-8 shadow-2xl backdrop-blur-xl transition-all hover:border-[#2a523c]/70">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="ml-1 text-xs font-bold tracking-wider text-[#7bb59a] uppercase">
                Player Name
              </label>
              <div
                className={`group relative transition-all duration-300 ${focused ? 'scale-[1.02] transform' : ''}`}
              >
                <input
                  className="w-full rounded-xl border-2 border-[#1f3b2b]/80 bg-[#06140d]/80 px-4 py-4 text-lg font-bold text-[#e7fdf5] shadow-inner transition-all placeholder:text-[#7bb59a]/50 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Enter your nickname..."
                  maxLength={15}
                  autoFocus
                />
                <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
                  <span
                    className={`text-xs font-bold transition-colors ${name.length > 0 ? 'text-emerald-400' : 'text-[#7bb59a]/40'}`}
                  >
                    {name.length}/15
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="group relative w-full transform overflow-hidden rounded-xl border border-white/10 bg-linear-to-r from-[#1f3b2b] to-[#2a523c] py-4 text-xl font-black text-[#e7fdf5] shadow-lg shadow-black/30 transition-all hover:from-[#2a523c] hover:to-[#326246] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                PLAY NOW
                <svg
                  className="h-5 w-5 transform transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </span>
              <div className="group-hover:animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-[#e7fdf5]/15 to-transparent" />
            </button>
          </form>
        </div>

        <div className="mt-8 space-y-2 text-center">
          <div className="relative mb-2 flex items-center justify-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="group flex items-center gap-2 rounded-lg border border-[#1f3b2b]/70 bg-[#06140d]/70 px-3 py-1.5 text-xs font-bold tracking-widest text-[#7bb59a] uppercase transition-all duration-200 hover:border-emerald-400/40 hover:bg-[#06140d] hover:text-emerald-300"
              title="Edit Controls"
            >
              Controls
              <svg
                className="h-3 w-3 transform transition-transform duration-500 group-hover:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-[#7bb59a]">
            <span className="rounded-lg border border-[#1f3b2b]/70 bg-[#06140d]/70 px-3 py-1">
              {keyBindings.left.toUpperCase()}/{keyBindings.right.toUpperCase()} Move
            </span>
            <span className="rounded-lg border border-[#1f3b2b]/70 bg-[#06140d]/70 px-3 py-1">
              {keyBindings.jump === ' ' ? 'SPACE' : keyBindings.jump.toUpperCase()} Jump
            </span>
            <span className="rounded-lg border border-[#1f3b2b]/70 bg-[#06140d]/70 px-3 py-1">
              {keyBindings.dash.toUpperCase()} Dash
            </span>
            <span className="rounded-lg border border-[#1f3b2b]/70 bg-[#06140d]/70 px-3 py-1">
              {keyBindings.attack.toUpperCase()} Attack
            </span>
            <span className="rounded-lg border border-[#1f3b2b]/70 bg-[#06140d]/70 px-3 py-1">
              Enter Chat
            </span>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm duration-200">
          <div className="relative w-full max-w-sm space-y-6 rounded-2xl border border-[#1f3b2b]/80 bg-[#020b06] p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-[#e7fdf5]">Control Settings</h2>

            <div className="space-y-4">
              {(['left', 'right', 'jump', 'dash', 'attack'] as const).map((action) => (
                <div key={action} className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#7bb59a] uppercase">{action}</label>
                  <input
                    type="text"
                    value={keyBindings[action]}
                    onChange={(e) => handleKeyChange(action, e)}
                    className="w-20 rounded-lg border border-[#1f3b2b]/80 bg-[#06140d]/80 px-3 py-2 text-center font-mono text-[#e7fdf5] uppercase focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none"
                    maxLength={1}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setKeyBindings(DEFAULT_KEY_BINDINGS)}
                className="flex-1 rounded-xl bg-[#06140d]/80 py-3 font-bold text-[#c9f4e2]/80 transition-colors hover:bg-[#06140d]"
              >
                Reset
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 rounded-xl bg-[#1f3b2b] py-3 font-bold text-[#e7fdf5] shadow-lg shadow-black/30 transition-colors hover:bg-[#2a523c]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
