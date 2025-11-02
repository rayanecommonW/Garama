"use client";
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerMessage, PlayerData } from '@garama/shared';
import { MAP_WIDTH, MAP_HEIGHT, PLAYER_RADIUS, PLAYER_COLOR } from '@garama/shared';
import DebugInfo from './DebugInfo';
import Chat from './Chat';
import Map from './Map';
import { GameState, spawnPlayer } from '../game/gameState';
import { setSocket as setGameLoopSocket, setOnMessageSent } from '../game/gameLoop';

const SERVER_URL = 'http://localhost:3001';

type Props = {
  playerName: string;
};

export default function GameSimple({ playerName }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTick, setLastTick] = useState<number | null>(null);
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [messagesSent, setMessagesSent] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatFloating, setIsChatFloating] = useState(false);
  const [playerCoords, setPlayerCoords] = useState<{ x: number; y: number } | null>(null);
  const hasSpawnedRef = useRef(false);

  useEffect(() => {
    const socketInstance = io(SERVER_URL);
    
    // Set socket and message callback for game loop
    setGameLoopSocket(socketInstance);
    setOnMessageSent(() => setMessagesSent(prev => prev + 1));

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Send join message to server
      socketInstance.emit('join', {
        type: 'join',
        name: playerName,
      });
      setMessagesSent(prev => prev + 1);
      
      // Spawn player locally when connected
      if (!hasSpawnedRef.current && socketInstance.id) {
        const player = spawnPlayer(
          socketInstance.id,
          playerName,
          MAP_WIDTH,
          MAP_HEIGHT,
          PLAYER_RADIUS,
          PLAYER_COLOR
        );
        GameState.localPlayerId = socketInstance.id;
        hasSpawnedRef.current = true;
        console.log('Player spawned at:', player.x, player.y);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('snapshot', (msg: ServerMessage & { type: 'snapshot' }) => {
      setLastTick(msg.timestamp);
      setMessagesReceived(prev => prev + 1);
      
      // Update all players from snapshot
      const currentPlayers = new Set<string>();
      
      msg.players.forEach((playerData: PlayerData) => {
        currentPlayers.add(playerData.id);
        
        if (playerData.id === GameState.localPlayerId) {
          // For local player, only update if not spawned yet
          if (!GameState.players.has(playerData.id)) {
            GameState.players.set(playerData.id, {
              id: playerData.id,
              name: playerData.name,
              x: playerData.x,
              y: playerData.y,
              radius: PLAYER_RADIUS,
              color: playerData.color,
            });
          }
          // Don't overwrite local player position from server (for now)
        } else {
          // For other players, always use server data
          GameState.players.set(playerData.id, {
            id: playerData.id,
            name: playerData.name,
            x: playerData.x,
            y: playerData.y,
            radius: PLAYER_RADIUS,
            color: playerData.color,
          });
        }
      });
      
      // Remove players that are no longer in the snapshot
      GameState.players.forEach((player, id) => {
        if (!currentPlayers.has(id)) {
          GameState.players.delete(id);
        }
      });
    });

    socketInstance.on('tick', (msg: ServerMessage & { type: 'tick' }) => {
      setLastTick(msg.timestamp);
      setMessagesReceived(prev => prev + 1);
    });

    setSocket(socketInstance);

    return () => {
      setSocket(null);
      setGameLoopSocket(null);
      setOnMessageSent(null);
      socketInstance.disconnect();
    };
  }, [playerName]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        if (isChatOpen) {
          setIsChatOpen(false);
        } else {
          setIsChatOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [socket, isConnected, isChatOpen]);

  // Update player coordinates for debug display
  useEffect(() => {
    const interval = setInterval(() => {
      if (GameState.localPlayerId) {
        const player = GameState.players.get(GameState.localPlayerId);
        if (player) {
          setPlayerCoords({ x: Math.round(player.x), y: Math.round(player.y) });
        }
      }
    }, 100); // Update every 100ms for display

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Map />
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700 p-4">
        <div className="grid grid-cols-3 gap-4 text-sm text-slate-200 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <span>Player: <strong>{playerName}</strong></span>
            <span>Status: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span></span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Socket.IO Connection</h2>
          </div>
          <div className="text-right space-y-1">
            <p>Server URL: {SERVER_URL}</p>
            <p>Last tick: {lastTick ? new Date(lastTick).toLocaleTimeString() : 'None'}</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 z-40">
        <DebugInfo
          title="Connection Details"
          items={[
            { label: 'Socket ID', value: socket?.id?.slice(0, 8) + '...' },
            { label: 'Connected At', value: socket?.connected ? new Date().toLocaleTimeString() : 'N/A' },
            { label: 'Messages Received', value: messagesReceived },
            { label: 'Messages Sent', value: messagesSent },
            { label: 'Chat Status', value: isChatOpen ? 'Open' : 'Closed', color: isChatOpen ? 'success' : 'default' },
            { label: 'Tick Rate', value: '20Hz' },
            { label: 'Player Position', value: playerCoords ? `(${playerCoords.x}, ${playerCoords.y})` : 'N/A' },
          ]}
        />
      </div>

      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-40">
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
    </>
  );
}
