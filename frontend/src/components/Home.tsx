"use client";
import { useState } from 'react';
import { DEFAULT_KEY_BINDINGS, KeyBindings } from '../game/input';

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
    setKeyBindings(prev => ({ ...prev, [action]: val }));
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center overflow-hidden relative font-sans">
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10 px-6">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400 mb-2 tracking-tight drop-shadow-lg transform hover:scale-105 transition-transform duration-300">
            WORK IN PROGRESS
          </h1>
          <p className="text-slate-400 text-lg font-medium tracking-wide uppercase">
            Multiplayer Arena
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl transform transition-all hover:border-slate-600/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Player Name
              </label>
              <div className={`relative group transition-all duration-300 ${focused ? 'transform scale-[1.02]' : ''}`}>
                <input
                  className="w-full bg-slate-800/80 border-2 border-slate-700 rounded-xl px-4 py-4 text-white font-bold text-lg placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-inner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Enter your nickname..."
                  maxLength={15}
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className={`text-xs font-bold transition-colors ${name.length > 0 ? 'text-green-400' : 'text-slate-600'}`}>
                    {name.length}/15
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl py-4 rounded-xl shadow-lg shadow-blue-900/30 transform transition-all active:scale-[0.98] hover:shadow-blue-900/50 border border-white/10 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                PLAY NOW
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2 relative">
             
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-blue-400 rounded-lg border border-slate-700/50 hover:border-blue-500/30 transition-all duration-200 group text-xs font-bold uppercase tracking-widest"
              title="Edit Controls"
            >
              Controls
              <svg className="w-3 h-3 transform group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
         
          <div className="flex justify-center gap-4 text-slate-400 text-sm font-medium flex-wrap">
            <span className="bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/50">
              {keyBindings.left.toUpperCase()}/{keyBindings.right.toUpperCase()} Move
            </span>
            <span className="bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/50">
              {keyBindings.jump === ' ' ? 'SPACE' : keyBindings.jump.toUpperCase()} Jump
            </span>
            <span className="bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/50">Enter Chat</span>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl space-y-6 relative">
            <h2 className="text-2xl font-bold text-white">Control Settings</h2>
            
            <div className="space-y-4">
              {(['left', 'right', 'jump'] as const).map((action) => (
                <div key={action} className="flex items-center justify-between">
                  <label className="text-slate-400 font-bold uppercase text-sm">{action}</label>
                  <input
                    type="text"
                    value={keyBindings[action]}
                    onChange={(e) => handleKeyChange(action, e)}
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    maxLength={1}
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 flex gap-3">
               <button 
                onClick={() => setKeyBindings(DEFAULT_KEY_BINDINGS)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors"
              >
                Reset
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/30 transition-colors"
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
