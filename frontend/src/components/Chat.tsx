"use client";
import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
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

export default function Chat({ isOpen, isFloating, socket, isConnected, onClose, onStateChange }: Props) {
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

  // Clean up floating messages after 3 seconds
  useEffect(() => {
    if (floatingMessages.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const filtered = floatingMessages.filter(msg => now - msg.timestamp < 3000);
      setFloatingMessages(filtered);

      // Update parent about floating state
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
      message: message.trim()
    };

    socket.emit('chat', chatMessage);

    // Add to floating messages
    const newMessage: FloatingMessage = {
      id: messageIdCounter.current++,
      message: message.trim(),
      timestamp: Date.now()
    };

    setFloatingMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Update parent about floating state
    onStateChange(isOpen, true);
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
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {isOpen && (
        <div ref={modalRef} className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type message..."
            className="px-3 py-2 bg-black/80 text-white text-center border-none outline-none rounded"
            disabled={!isConnected}
          />
        </div>
      )}

      {floatingMessages.map((floatingMsg, index) => (
        <FloatingText
          key={floatingMsg.id}
          message={floatingMsg.message}
          delay={index * 200} // Stagger animations
        />
      ))}
    </div>
  );
}

// Separate component for individual floating messages
function FloatingText({ message, delay }: { message: string; delay: number }) {
  return (
    <p
      className="absolute text-white text-2xl font-light animate-float-up pointer-events-none"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {message}
    </p>
  );
}
