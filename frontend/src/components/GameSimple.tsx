'use client';
import { MAP_WIDTH, MAP_HEIGHT, PLAYER_RADIUS, PLAYER_COLOR, PLAYER_MAX_HEALTH } from '@garama/shared';
import { useEffect, useState, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

import { setSocket as setGameLoopSocket, setOnMessageSent, resetFreeCamToPlayer } from '../game/gameLoop';
import { GameState, spawnPlayer } from '../game/gameState';
import { type KeyBindings } from '../game/input';

import Chat from './Chat';
import DebugInfo from './DebugInfo';
import Map from './Map';

import type { ServerMessage, PlayerData } from '@garama/shared';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';

type Props = {
  playerName: string;
  keyBindings: KeyBindings;
};

export default function GameSimple({ playerName, keyBindings }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTick, setLastTick] = useState<number | null>(null);
  const [serverTick, setServerTick] = useState<number>(0);
  const [messagesReceived, setMessagesReceived] = useState(0);
  const [messagesSent, setMessagesSent] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatFloating, setIsChatFloating] = useState(false);
  const [playerCoords, setPlayerCoords] = useState<{ x: number; y: number } | null>(null);
  const [localHealth, setLocalHealth] = useState<number>(PLAYER_MAX_HEALTH);
  const [isDead, setIsDead] = useState<boolean>(false);
  const hasSpawnedRef = useRef(false);
  const deathDisconnectTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const socketInstance = io(SERVER_URL);

    setGameLoopSocket(socketInstance);
    setOnMessageSent(() => setMessagesSent((prev) => prev + 1));

    socketInstance.on('connect', () => {
      console.info('Connected to server');
      setIsConnected(true);

      socketInstance.emit('join', {
        type: 'join',
        name: playerName,
      });
      setMessagesSent((prev) => prev + 1);

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
          setLocalHealth(PLAYER_MAX_HEALTH);
          setIsDead(false);
        console.info('Player spawned at:', player.x, player.y);
      }
    });

    socketInstance.on('disconnect', () => {
      console.info('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('snapshot', (msg: ServerMessage & { type: 'snapshot' }) => {
      setLastTick(msg.timestamp);
      setServerTick(msg.serverTick);
      setMessagesReceived((prev) => prev + 1);

      const currentPlayers = new Set<string>();

      msg.players.forEach((playerData: PlayerData) => {
        currentPlayers.add(playerData.id);

        if (playerData.id === GameState.localPlayerId) {
          if (!GameState.players.has(playerData.id)) {
            GameState.players.set(playerData.id, {
              id: playerData.id,
              name: playerData.name,
              x: playerData.x,
              y: playerData.y,
              vx: 0,
              vy: 0,
              onGround: false,
              jumpHoldMs: 0,
              radius: PLAYER_RADIUS,
              color: playerData.color,
              hp: playerData.hp ?? PLAYER_MAX_HEALTH,
              isDead: playerData.isDead ?? false,
              hitFlashMs: 0,
            });
          }
          const localPlayer = GameState.players.get(playerData.id);
          if (localPlayer) {
            // Keep client-side prediction for the local player; only sync health/death.
            localPlayer.hp = playerData.hp ?? localPlayer.hp;
            localPlayer.isDead = playerData.isDead ?? localPlayer.isDead;
            setLocalHealth(localPlayer.hp);
            setIsDead(localPlayer.isDead);
          }
        } else {
          const existing = GameState.players.get(playerData.id);
          if (existing) {
            existing.x = playerData.x;
            existing.y = playerData.y;
            existing.hp = playerData.hp ?? existing.hp;
            existing.isDead = playerData.isDead ?? existing.isDead;
          } else {
            GameState.players.set(playerData.id, {
              id: playerData.id,
              name: playerData.name,
              x: playerData.x,
              y: playerData.y,
              vx: 0,
              vy: 0,
              onGround: false,
              jumpHoldMs: 0,
              radius: PLAYER_RADIUS,
              color: playerData.color,
              hp: playerData.hp ?? PLAYER_MAX_HEALTH,
              isDead: playerData.isDead ?? false,
              hitFlashMs: 0,
            });
          }
        }
      });

      GameState.players.forEach((player, id) => {
        if (!currentPlayers.has(id)) {
          GameState.players.delete(id);
        }
      });
    });

    socketInstance.on('tick', (msg: ServerMessage & { type: 'tick' }) => {
      setLastTick(msg.timestamp);
      setMessagesReceived((prev) => prev + 1);
    });

    socketInstance.on('damage', (msg: ServerMessage & { type: 'damage'; targetId: string; hp: number }) => {
      const target = GameState.players.get(msg.targetId);
      if (target) {
        target.hp = msg.hp;
        target.hitFlashMs = 200;
        if (msg.hp <= 0) {
          target.isDead = true;
        }
        if (msg.targetId === GameState.localPlayerId) {
          setLocalHealth(msg.hp);
          if (msg.hp <= 0) {
            setIsDead(true);
            if (!deathDisconnectTimer.current && socketInstance.connected) {
              deathDisconnectTimer.current = setTimeout(() => {
                socketInstance.disconnect();
                deathDisconnectTimer.current = null;
              }, 5000);
            }
          }
        }
      }
    });

    socketInstance.on('death', (msg: ServerMessage & { type: 'death'; targetId: string }) => {
      const target = GameState.players.get(msg.targetId);
      if (target) {
        target.isDead = true;
        if (msg.targetId === GameState.localPlayerId) {
          setIsDead(true);
          if (!deathDisconnectTimer.current && socketInstance.connected) {
            deathDisconnectTimer.current = setTimeout(() => {
              socketInstance.disconnect();
              deathDisconnectTimer.current = null;
            }, 5000);
          }
        }
      }
    });

    setSocket(socketInstance);

    return () => {
      setSocket(null);
      setGameLoopSocket(null);
      setOnMessageSent(null);
      if (deathDisconnectTimer.current) {
        clearTimeout(deathDisconnectTimer.current);
        deathDisconnectTimer.current = null;
      }
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (GameState.localPlayerId) {
        const player = GameState.players.get(GameState.localPlayerId);
        if (player) {
          setPlayerCoords({ x: Math.round(player.x), y: Math.round(player.y) });
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleReturnToLobby = () => {
    socket?.disconnect();
    setGameLoopSocket(null);
    window.location.href = '/';
  };

  return (
    <>
      <Map keyBindings={keyBindings} />
      <div className="fixed top-0 right-0 left-0 z-50 border-b border-slate-700 bg-slate-800 p-4">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-4 text-sm text-slate-200">
          <div className="flex items-center gap-4">
            <span>
              Player: <strong>{playerName}</strong>
            </span>
            <span>
              Status:{' '}
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Socket.IO Connection</h2>
          </div>
          <div className="space-y-1 text-right">
            <p>Last tick: {lastTick ? new Date(lastTick).toLocaleTimeString() : 'None'}</p>
          </div>
        </div>
      </div>

      <div className="fixed top-[84px] left-4 z-50 flex items-center gap-3 text-sm text-slate-100">
        <span className="font-semibold">HP</span>
        <div className="h-3 w-44 overflow-hidden rounded bg-slate-700">
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${Math.max(0, (localHealth / PLAYER_MAX_HEALTH) * 100)}%` }}
          />
        </div>
        <span className="w-10 text-right">{localHealth}</span>
      </div>

      <div className="fixed right-4 bottom-4 z-40">
        <DebugInfo
          title="Connection Details"
          items={[
            { label: 'Socket ID', value: `${socket?.id?.slice(0, 8)}...` },
            { label: 'Server Tick', value: serverTick, color: 'info' },
            {
              label: 'Connected At',
              value: socket?.connected ? new Date().toLocaleTimeString() : 'N/A',
            },
            { label: 'Messages Received', value: messagesReceived },
            { label: 'Messages Sent', value: messagesSent },
            {
              label: 'Chat Status',
              value: isChatOpen ? 'Open' : 'Closed',
              color: isChatOpen ? 'success' : 'default',
            },
            { label: 'Tick Rate', value: '20Hz' },
            {
              label: 'Player Position',
              value: playerCoords ? `(${playerCoords.x}, ${playerCoords.y})` : 'N/A',
            },
          ]}
          onToggleCollisions={() => {
            GameState.debugCollisions = !GameState.debugCollisions;
          }}
          collisionsEnabled={GameState.debugCollisions}
          onToggleFreeCam={() => {
            const newValue = !GameState.freeCamMode;
            GameState.freeCamMode = newValue;
            if (newValue) {
              // Initialize free cam position to player location
              resetFreeCamToPlayer();
            }
          }}
          freeCamEnabled={GameState.freeCamMode}
          onToggleCoordinates={() => {
            GameState.showCoordinates = !GameState.showCoordinates;
          }}
          coordinatesEnabled={GameState.showCoordinates}
        />
      </div>

      <div className="fixed top-1/4 left-1/2 z-40 -translate-x-1/2">
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

      {isDead && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 text-white">
          <h2 className="mb-4 text-3xl font-bold">You died</h2>
          <p className="mb-6 text-sm text-slate-200">Return to the lobby to respawn.</p>
          <button
            onClick={handleReturnToLobby}
            className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-500"
          >
            Return to lobby
          </button>
        </div>
      )}
    </>
  );
}
