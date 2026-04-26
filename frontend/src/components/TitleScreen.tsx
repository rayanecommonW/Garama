'use client';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  onStart: () => void;
};

type MenuItem = {
  id: 'start' | 'options' | 'achievements' | 'extras' | 'quit';
  label: string;
  enabled: boolean;
};

const MENU: MenuItem[] = [
  { id: 'start', label: 'Start Game', enabled: true },
  { id: 'options', label: 'Options', enabled: false },
  { id: 'achievements', label: 'Achievements', enabled: false },
  { id: 'extras', label: 'Extras', enabled: false },
  { id: 'quit', label: 'Quit Game', enabled: false },
];

type Dust = { left: number; size: number; delay: number; duration: number; opacity: number };

export default function TitleScreen({ onStart }: Props) {
  const [hoveredId, setHoveredId] = useState<MenuItem['id']>('start');

  const dust = useMemo<Dust[]>(
    () =>
      Array.from({ length: 28 }).map(() => ({
        left: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: -Math.random() * 18,
        duration: 14 + Math.random() * 18,
        opacity: 0.25 + Math.random() * 0.4,
      })),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStart();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const enabled = MENU.filter((m) => m.enabled);
        if (!enabled.length) return;
        const idx = enabled.findIndex((m) => m.id === hoveredId);
        const next =
          e.key === 'ArrowDown'
            ? enabled[(idx + 1) % enabled.length]
            : enabled[(idx - 1 + enabled.length) % enabled.length];
        setHoveredId(next.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hoveredId, onStart]);

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black font-display text-slate-100 select-none">
      {/* Vignette / atmospheric background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, rgba(60,70,90,0.55) 0%, rgba(15,18,24,0.85) 45%, #000 80%)',
        }}
      />

      {/* Light beams */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="hk-beam absolute top-0 left-1/2 h-full w-[55%] origin-top blur-2xl"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(200,215,255,0.18) 35%, rgba(255,255,255,0) 75%)',
            transform: 'translateX(-50%)',
          }}
        />
        <div
          className="hk-beam absolute top-0 left-1/2 h-full w-[22%] origin-top blur-md"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(220,230,255,0.25) 30%, rgba(255,255,255,0) 70%)',
            transform: 'translateX(-50%)',
            animationDelay: '-2s',
          }}
        />
        <div
          className="hk-beam absolute top-0 left-1/2 h-full w-[8%] origin-top"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)',
            transform: 'translateX(-50%)',
            animationDelay: '-4s',
          }}
        />
      </div>

      {/* Floating dust */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {dust.map((d, i) => (
          <span
            key={i}
            className="hk-dust absolute bottom-0 rounded-full bg-white"
            style={{
              left: `${d.left}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              opacity: d.opacity,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      {/* Bottom fade to black */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-between px-10 py-12">
        {/* Title */}
        <div className="hk-fade-in mt-[12vh] flex flex-col items-center">
          <h1
            className="hk-title-glow text-center font-display text-7xl font-semibold tracking-[0.18em] text-white sm:text-8xl md:text-[7rem]"
            style={{ letterSpacing: '0.18em' }}
          >
            GARAMA
          </h1>
          {/* Decorative ornament */}
          <div className="mt-6 flex items-center gap-4 text-white/70">
            <Ornament direction="left" />
            <svg width="44" height="44" viewBox="0 0 44 44" className="text-white/80">
              <circle
                cx="22"
                cy="22"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <circle cx="22" cy="22" r="3" fill="currentColor" />
              <path
                d="M22 12 L22 4 M22 32 L22 40 M12 22 L4 22 M32 22 L40 22"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            <Ornament direction="right" />
          </div>
        </div>

        {/* Menu */}
        <nav className="hk-fade-in-slow mb-[6vh] flex flex-col items-center gap-3">
          {MENU.map((item) => {
            const isHovered = hoveredId === item.id;
            return (
              <button
                key={item.id}
                disabled={!item.enabled}
                onMouseEnter={() => item.enabled && setHoveredId(item.id)}
                onClick={() => item.enabled && item.id === 'start' && onStart()}
                className={`group relative px-8 py-1 font-display text-2xl tracking-[0.25em] transition-all duration-200 sm:text-3xl ${
                  item.enabled
                    ? 'cursor-pointer text-white/90 hover:text-white'
                    : 'cursor-not-allowed text-white/25'
                }`}
                style={{
                  textShadow: item.enabled
                    ? '0 0 14px rgba(255,255,255,0.35), 0 0 30px rgba(180,200,255,0.18)'
                    : 'none',
                }}
              >
                <span
                  aria-hidden
                  className={`absolute top-1/2 -left-7 -translate-y-1/2 text-sm transition-all duration-200 ${
                    isHovered && item.enabled
                      ? 'translate-x-0 opacity-100'
                      : '-translate-x-2 opacity-0'
                  }`}
                >
                  ✦
                </span>
                <span className="relative">{item.label.toUpperCase()}</span>
                <span
                  aria-hidden
                  className={`absolute top-1/2 -right-7 -translate-y-1/2 text-sm transition-all duration-200 ${
                    isHovered && item.enabled
                      ? 'translate-x-0 opacity-100'
                      : 'translate-x-2 opacity-0'
                  }`}
                >
                  ✦
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer left: version */}
      <div className="pointer-events-none absolute bottom-6 left-6 z-20 font-serif text-xs leading-tight text-white/50">
        <div className="font-display tracking-widest text-white/60">VULKAN MODE</div>
        <div className="mt-1">Build 0.1.0 — pre-alpha</div>
        <div>Garama Project (Web)</div>
      </div>

      {/* Footer right: studio */}
      <div className="pointer-events-none absolute right-6 bottom-6 z-20 flex items-center gap-2 font-display text-[11px] tracking-[0.3em] text-white/55">
        <svg width="22" height="22" viewBox="0 0 22 22" className="text-white/70">
          <circle cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="11" cy="11" r="4" fill="currentColor" opacity="0.6" />
        </svg>
        <span>GARAMA STUDIO</span>
      </div>
    </div>
  );
}

function Ornament({ direction }: { direction: 'left' | 'right' }) {
  const transform = direction === 'left' ? '' : 'scale(-1, 1)';
  return (
    <svg
      width="120"
      height="22"
      viewBox="0 0 120 22"
      style={{ transform }}
      className="text-white/60"
    >
      <path
        d="M0 11 L80 11"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M80 11 Q90 4 100 11 Q110 18 118 11"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
      />
      <circle cx="80" cy="11" r="1.4" fill="currentColor" />
      <circle cx="118" cy="11" r="1.4" fill="currentColor" />
    </svg>
  );
}
