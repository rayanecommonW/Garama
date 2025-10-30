"use client";
import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import type { ClientMessage } from '@garama/shared';

type Props = {
  socket: Socket | null;
  isConnected: boolean;
  onClose: () => void;
  onMessageSent: (message: string) => void;
};

export default function Chat({ socket, isConnected, onClose, onMessageSent }: Props) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when chat opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const sendMessage = () => {
    if (!socket || !isConnected || !message.trim()) return;

    const chatMessage: ClientMessage = {
      type: 'chat',
      message: message.trim()
    };

    socket.emit('chat', chatMessage);
    onMessageSent(message.trim());
    setMessage('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-slate-200 mb-2">Send Message</h3>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-center focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            disabled={!isConnected}
          />
        </div>
        <div className="text-center text-sm text-slate-400">
          Press Enter to send • Press Escape to cancel
        </div>
      </div>
    </div>
  );
}
