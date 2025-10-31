"use client";
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerMessage } from '@garama/shared';
import DebugInfo from './DebugInfo';
import Chat from './Chat';

const SERVER_URL = 'http://localhost:3001';

type Props = {
  playerName: string;
};

export default function GameSimple({ playerName }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTick, setLastTick] = useState<number | null>(null);
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatFloating, setIsChatFloating] = useState(false);

  useEffect(() => {
    const socketInstance = io(SERVER_URL);

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('tick', (msg: ServerMessage & { type: 'tick' }) => {
      setLastTick(msg.timestamp);
      setMessagesReceived(prev => prev + 1);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();

        // Condition: if it's open then close it, if it close we open it, if we're in the fade phase you can open it
        if (isChatOpen) {
          // If it's open, close it
          setIsChatOpen(false);
        } else {
          // If it's closed or in fade phase, open it
          setIsChatOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [socket, isConnected, isChatOpen]);

  return (
    <div className="relative w-full max-w-[960px]">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
        <span>Player: <strong>{playerName}</strong></span>
        <div className="flex items-center gap-4">
          <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
          <span>Chat: {isChatOpen ? 'Open' : 'Closed'}</span>
        </div>
      </div>

      <div className="relative rounded-lg border border-slate-700 bg-slate-900 p-8">
        <div className="text-center text-slate-200">
          <h2 className="text-xl font-semibold mb-4">Socket.IO Connection</h2>
          <div className="space-y-2">
            <p>Status: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span></p>
            <p>Server URL: {SERVER_URL}</p>
            <p>Last tick: {lastTick ? new Date(lastTick).toLocaleTimeString() : 'None'}</p>
            <p>Chat: {isChatOpen ? 'Open' : 'Closed'}</p>
            <p className="text-sm text-slate-400 mt-4">
              Press <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">Enter</kbd> to open chat
            </p>
          </div>
        </div>

      </div>

      <DebugInfo
        title="Connection Details"
        items={[
          { label: 'Socket ID', value: socket?.id?.slice(0, 8) + '...' },
          { label: 'Connected At', value: socket?.connected ? new Date().toLocaleTimeString() : 'N/A' },
          { label: 'Messages Received', value: messagesReceived },
          { label: 'Chat Status', value: isChatOpen ? 'Open' : 'Closed', color: isChatOpen ? 'success' : 'default' },
          { label: 'Tick Rate', value: '20Hz' },
        ]}
      />

      {(isChatOpen || isChatFloating) && (
        <Chat
          isOpen={isChatOpen}
          isFloating={isChatFloating}
          socket={socket}
          isConnected={isConnected}
          onClose={() => setIsChatOpen(false)}
          onStateChange={(newIsOpen, newIsFloating) => {
            setIsChatOpen(newIsOpen);
            setIsChatFloating(newIsFloating);
          }}
        />
      )}
    </div>
  );
}
