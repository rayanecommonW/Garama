'use client';
import { useState } from 'react';

import { DEFAULT_KEY_BINDINGS, type KeyBindings } from '../game/input';

type Props = {
  onStart: (name: string, keyMap: KeyBindings) => void;
  onBack?: () => void;
};

export default function Home({ onStart, onBack }: Props) {
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black font-display text-slate-100 select-none">
      {/* Atmospheric background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(60,70,90,0.45) 0%, rgba(15,18,24,0.85) 45%, #000 80%)',
        }}
      />

      {/* Subtle light beam */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="hk-beam absolute top-0 left-1/2 h-full w-[40%] origin-top blur-2xl"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.25) 0%, rgba(200,215,255,0.12) 40%, rgba(255,255,255,0) 80%)',
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/60 to-transparent" />

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 font-display text-xs tracking-[0.3em] text-white/55 transition-colors hover:text-white"
        >
          <span aria-hidden>←</span>
          <span>BACK</span>
        </button>
      )}

      <div className="relative z-10 hk-fade-in w-full max-w-lg px-6">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-3 text-white/50">
            <Ornament direction="left" />
            <span className="text-xs tracking-[0.4em]">PREPARE</span>
            <Ornament direction="right" />
          </div>
          <h1
            className="hk-title-glow font-display text-5xl font-semibold tracking-[0.2em] text-white sm:text-6xl"
            style={{ letterSpacing: '0.18em' }}
          >
            ENTER THE ARENA
          </h1>
          <p className="mt-3 font-serif text-lg italic text-white/55">
            Speak thy name, wanderer.
          </p>
        </div>

        {/* Card */}
        <div
          className="relative rounded-sm border border-white/10 bg-white/[0.03] p-8 shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-sm"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))',
          }}
        >
          {/* Decorative corners */}
          <Corner className="-top-px -left-px" />
          <Corner className="-top-px -right-px rotate-90" />
          <Corner className="-bottom-px -left-px -rotate-90" />
          <Corner className="-right-px -bottom-px rotate-180" />

          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-3">
              <label className="block text-center font-display text-[11px] tracking-[0.4em] text-white/55">
                — PLAYER NAME —
              </label>
              <div
                className={`group relative transition-all duration-300 ${focused ? 'scale-[1.01]' : ''}`}
              >
                <input
                  className="w-full border-y border-white/15 bg-transparent px-4 py-4 text-center font-serif text-2xl tracking-wider text-white placeholder:text-white/25 focus:border-white/50 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="…"
                  maxLength={15}
                  autoFocus
                  style={{
                    textShadow: name
                      ? '0 0 14px rgba(255,255,255,0.4), 0 0 30px rgba(180,200,255,0.2)'
                      : 'none',
                  }}
                />
                <div className="mt-1 text-right font-display text-[10px] tracking-widest text-white/40">
                  {name.length}/15
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="group relative mx-auto flex w-full items-center justify-center gap-3 py-3 font-display text-xl tracking-[0.3em] text-white/90 transition-all hover:text-white disabled:cursor-not-allowed disabled:text-white/20"
              style={{
                textShadow: name.trim()
                  ? '0 0 14px rgba(255,255,255,0.35), 0 0 30px rgba(180,200,255,0.18)'
                  : 'none',
              }}
            >
              <span
                aria-hidden
                className="text-sm opacity-0 transition-all group-enabled:group-hover:opacity-100"
              >
                ✦
              </span>
              <span>ENTER</span>
              <span
                aria-hidden
                className="text-sm opacity-0 transition-all group-enabled:group-hover:opacity-100"
              >
                ✦
              </span>
            </button>
          </form>
        </div>

        {/* Controls */}
        <div className="mt-10 space-y-4 text-center">
          <div className="flex items-center justify-center gap-3 text-white/40">
            <Ornament direction="left" small />
            <button
              onClick={() => setShowSettings(true)}
              className="font-display text-[11px] tracking-[0.4em] text-white/55 transition-colors hover:text-white"
            >
              CONTROLS
            </button>
            <Ornament direction="right" small />
          </div>

          <div className="flex flex-wrap justify-center gap-2 font-display text-[10px] tracking-[0.25em] text-white/55">
            <KeyChip>{`${keyBindings.left.toUpperCase()}/${keyBindings.right.toUpperCase()} MOVE`}</KeyChip>
            <KeyChip>
              {`${keyBindings.jump === ' ' ? 'SPACE' : keyBindings.jump.toUpperCase()} JUMP`}
            </KeyChip>
            <KeyChip>{`${keyBindings.dash.toUpperCase()} DASH`}</KeyChip>
            <KeyChip>{`${keyBindings.attack.toUpperCase()} ATTACK`}</KeyChip>
            <KeyChip>ENTER CHAT</KeyChip>
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm border border-white/15 bg-black/80 p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
            <Corner className="-top-px -left-px" />
            <Corner className="-top-px -right-px rotate-90" />
            <Corner className="-bottom-px -left-px -rotate-90" />
            <Corner className="-right-px -bottom-px rotate-180" />

            <h2 className="mb-6 text-center font-display text-xl tracking-[0.3em] text-white/90">
              CONTROLS
            </h2>

            <div className="space-y-3">
              {(['left', 'right', 'jump', 'dash', 'attack'] as const).map((action) => (
                <div
                  key={action}
                  className="flex items-center justify-between border-b border-white/5 pb-2"
                >
                  <label className="font-display text-xs tracking-[0.3em] text-white/55 uppercase">
                    {action}
                  </label>
                  <input
                    type="text"
                    value={keyBindings[action]}
                    onChange={(e) => handleKeyChange(action, e)}
                    className="w-16 border border-white/15 bg-transparent py-2 text-center font-display text-sm tracking-widest text-white uppercase focus:border-white/50 focus:outline-none"
                    maxLength={1}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setKeyBindings(DEFAULT_KEY_BINDINGS)}
                className="flex-1 border border-white/15 py-2 font-display text-xs tracking-[0.3em] text-white/60 transition-colors hover:border-white/40 hover:text-white"
              >
                RESET
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 border border-white/30 py-2 font-display text-xs tracking-[0.3em] text-white transition-colors hover:border-white hover:bg-white/5"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-white/10 bg-white/[0.03] px-3 py-1 backdrop-blur-sm">
      {children}
    </span>
  );
}

function Corner({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      className={`absolute text-white/40 ${className}`}
    >
      <path d="M0 0 L14 0 M0 0 L0 14" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function Ornament({
  direction,
  small = false,
}: {
  direction: 'left' | 'right';
  small?: boolean;
}) {
  const w = small ? 60 : 100;
  const transform = direction === 'left' ? '' : 'scale(-1, 1)';
  return (
    <svg
      width={w}
      height="14"
      viewBox={`0 0 ${w} 14`}
      style={{ transform }}
      className="text-white/40"
    >
      <path d={`M0 7 L${w - 30} 7`} stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path
        d={`M${w - 30} 7 Q${w - 22} 2 ${w - 14} 7 Q${w - 6} 12 ${w - 2} 7`}
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
      />
      <circle cx={w - 30} cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
}
