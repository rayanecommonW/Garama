import React from 'react';

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Garama',
  description: 'Multiplayer .io demo built with Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#020b06] text-[#e7fdf5] antialiased">{children}</body>
    </html>
  );
}
