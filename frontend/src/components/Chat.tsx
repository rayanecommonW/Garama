'use client';
import { useEffect, useRef, useState } from 'react';

type Props = {
  isOpen: boolean;
  isConnected: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
};

export default function Chat({
  isOpen,
  isConnected,
  onClose,
  onSendMessage,
}: Props) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const sendMessage = () => {
    const trimmed = message.trim();
    if (!isConnected) return;
    if (!trimmed) {
      onClose();
      return;
    }

    onSendMessage(trimmed);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div ref={modalRef} className="p-4">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type message..."
          className="w-[340px] rounded border border-[#1f3b2b]/80 bg-[#020b06]/80 px-3 py-2 text-center text-[#e7fdf5] outline-none placeholder:text-[#7bb59a]/70 focus:border-[#2a523c] focus:ring-2 focus:ring-[#1f3b2b]/40 disabled:opacity-60"
          disabled={!isConnected}
        />
      </div>
    </div>
  );
}
