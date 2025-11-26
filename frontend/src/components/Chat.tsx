'use client';
import { useEffect, useRef, useState } from 'react';
import { type Socket } from 'socket.io-client';

import type { ClientMessage } from '@garama/shared';

type FloatingMessage = {
  id: number;
  message: string;
  timestamp: number;
};

type Props = {
  isOpen: boolean;
  isFloating: boolean;
  socket: Socket | null;
  isConnected: boolean;
  onClose: () => void;
  onStateChange: (isOpen: boolean, isFloating: boolean) => void;
};

export default function Chat({
  isOpen,
  isFloating,
  socket,
  isConnected,
  onClose,
  onStateChange,
}: Props) {
  const [message, setMessage] = useState('');
  const [floatingMessages, setFloatingMessages] = useState<FloatingMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (floatingMessages.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const filtered = floatingMessages.filter((msg) => now - msg.timestamp < 3000);
      setFloatingMessages(filtered);

      const newIsFloating = filtered.length > 0;
      if (newIsFloating !== isFloating) {
        onStateChange(isOpen, newIsFloating);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [floatingMessages, isFloating, isOpen, onStateChange]);

  const sendMessage = () => {
    if (!socket || !isConnected || !message.trim()) return;

    const chatMessage: ClientMessage = {
      type: 'chat',
      message: message.trim(),
    };

    socket.emit('chat', chatMessage);

    const newMessage: FloatingMessage = {
      id: messageIdCounter.current++,
      message: message.trim(),
      timestamp: Date.now(),
    };

    setFloatingMessages((prev) => [...prev, newMessage]);
    setMessage('');

    onStateChange(false, true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen && !isFloating) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {isOpen && (
        <div ref={modalRef} className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type message..."
            className="rounded border-none bg-black/80 px-3 py-2 text-center text-white outline-none"
            disabled={!isConnected}
          />
        </div>
      )}

      {floatingMessages.map((floatingMsg, index) => (
        <FloatingText key={floatingMsg.id} message={floatingMsg.message} delay={index * 200} />
      ))}
    </div>
  );
}

function FloatingText({ message, delay }: { message: string; delay: number }) {
  return (
    <p
      className="animate-float-up pointer-events-none absolute text-2xl font-light text-white"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {message}
    </p>
  );
}
