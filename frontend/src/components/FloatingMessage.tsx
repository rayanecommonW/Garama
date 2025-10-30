"use client";
import { useEffect, useState } from 'react';

type Props = {
  message: string;
  onDisappear: () => void;
};

export default function FloatingMessage({ message, onDisappear }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDisappear, 300); // Allow fade out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDisappear]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
      <div className="bg-slate-800/90 border border-slate-600 rounded-lg px-6 py-4 shadow-xl animate-fade-in">
        <p className="text-slate-200 text-lg font-medium text-center">
          "{message}"
        </p>
      </div>
    </div>
  );
}
