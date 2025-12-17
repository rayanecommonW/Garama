'use client';
import { MAP_WIDTH, MAP_HEIGHT, PLAYER_RADIUS, PLAYER_COLOR, PLAYER_MAX_HEALTH } from '@garama/shared';
import { useEffect, useState, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';

import { enqueueChatMessage, clearPlayerChat } from '../game/chatBubbles';
import { setSocket as setGameLoopSocket, setOnMessageSent, resetFreeCamToPlayer } from '../game/gameLoop';
import { GameState, spawnPlayer } from '../game/gameState';
import { type KeyBindings } from '../game/input';
import { startClockSync } from '../game/net/clockSync';

import Chat from './Chat';
import DebugInfo from './DebugInfo';
import Leaderboard from './Leaderboard';
import Map from './Map';
import MiniMap from './MiniMap';

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
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [playerCoords, setPlayerCoords] = useState<{ x: number; y: number } | null>(null);
  const [localHealth, setLocalHealth] = useState<number>(PLAYER_MAX_HEALTH);
  const [isDead, setIsDead] = useState<boolean>(false);
  const hasSpawnedRef = useRef(false);
  const deathDisconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const transportName = (socket as any)?.io?.engine?.transport?.name as string | undefined;
  const remoteBufferSizes = Array.from(GameState.net.remoteSnapshots.values()).map((buffer) => buffer.length);
  const remoteBufferStats =
    remoteBufferSizes.length > 0
      ? {
          min: Math.min(...remoteBufferSizes),
          max: Math.max(...remoteBufferSizes),
          avg: remoteBufferSizes.reduce((sum, v) => sum + v, 0) / remoteBufferSizes.length,
        }
      : null;

  useEffect(() => {
    const socketInstance = io(SERVER_URL);
    let stopClockSync: (() => void) | null = null;

    setGameLoopSocket(socketInstance);
    setOnMessageSent(() => setMessagesSent((prev) => prev + 1));

    socketInstance.on('connect', () => {
      console.info('Connected to server');
      setIsConnected(true);

      stopClockSync?.();
      stopClockSync = startClockSync(socketInstance).stop;

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
      stopClockSync?.();
      stopClockSync = null;
    });

    socketInstance.on('chat', (msg: ServerMessage & { type: 'chat' }) => {
      // Render remote players' chat above their character (local sender is handled client-side).
      if (!msg.from) return;
      enqueueChatMessage(msg.from, msg.message, performance.now());
      setMessagesReceived((prev) => prev + 1);
    });

    socketInstance.on('snapshot', (msg: ServerMessage & { type: 'snapshot' }) => {
      setLastTick(msg.timestamp);
      setServerTick(msg.serverTick);
      setMessagesReceived((prev) => prev + 1);

      const currentPlayers = new Set<string>();
      const maxSamplesPerRemote = 60;
      GameState.net.lastSnapshotServerTime = msg.serverTime;
      GameState.net.lastSnapshotClientRecvMs = performance.now();

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
              score: playerData.score,
              isDead: playerData.isDead ?? false,
              isSprinting: false,
              hitFlashMs: 0,
              isCharging: playerData.isCharging ?? false,
              attackHoldStartedAtServerTime: playerData.attackHoldStartedAtServerTime ?? null,
              attackVariant: 'normal',
              dashMsLeft: 0,
              dashCooldownMs: 0,
              dashDir: 'right',
              canAirDash: true,
              sprintJumpBoostMsLeft: 0,
              sprintJumpBoostDir: 1,
            });
          }
          const localPlayer = GameState.players.get(playerData.id);
          if (localPlayer) {
            // Keep client-side prediction for the local player; only sync health/death.
            localPlayer.hp = playerData.hp ?? localPlayer.hp;
            localPlayer.score = playerData.score;
            localPlayer.isDead = playerData.isDead ?? localPlayer.isDead;
            localPlayer.isCharging = playerData.isCharging ?? localPlayer.isCharging ?? false;
            localPlayer.attackHoldStartedAtServerTime = playerData.attackHoldStartedAtServerTime ?? null;
            setLocalHealth(localPlayer.hp);
            setIsDead(localPlayer.isDead);
          }
        } else {
          const existing = GameState.players.get(playerData.id);
          if (existing) {
            existing.hp = playerData.hp ?? existing.hp;
            existing.score = playerData.score;
            existing.isDead = playerData.isDead ?? existing.isDead;
            existing.isCharging = playerData.isCharging ?? existing.isCharging ?? false;
            existing.attackHoldStartedAtServerTime = playerData.attackHoldStartedAtServerTime ?? null;
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
              score: playerData.score,
              isDead: playerData.isDead ?? false,
              isSprinting: false,
              hitFlashMs: 0,
              isCharging: playerData.isCharging ?? false,
              attackHoldStartedAtServerTime: playerData.attackHoldStartedAtServerTime ?? null,
              attackVariant: 'normal',
              dashMsLeft: 0,
              dashCooldownMs: 0,
              dashDir: 'right',
              canAirDash: true,
              sprintJumpBoostMsLeft: 0,
              sprintJumpBoostDir: 1,
            });
          }

          const samples = GameState.net.remoteSnapshots.get(playerData.id) ?? [];
          if (!GameState.net.remoteSnapshots.has(playerData.id)) {
            GameState.net.remoteSnapshots.set(playerData.id, samples);
          }

          samples.push({ serverTime: msg.serverTime, x: playerData.x, y: playerData.y });
          if (samples.length > maxSamplesPerRemote) {
            samples.splice(0, samples.length - maxSamplesPerRemote);
          }
        }
      });

      GameState.players.forEach((player, id) => {
        if (!currentPlayers.has(id)) {
          GameState.players.delete(id);
          GameState.net.remoteSnapshots.delete(id);
          clearPlayerChat(id);
        }
      });
    });

    socketInstance.on('attack_vfx', (msg: ServerMessage & { type: 'attack_vfx' }) => {
      setMessagesReceived((prev) => prev + 1);
      const attacker = GameState.players.get(msg.attackerId);
      if (!attacker) return;

      attacker.attackMsLeft = msg.isCharged ? 220 : 140;
      attacker.attackDir = msg.direction;
      attacker.attackVariant = msg.isCharged ? 'charged' : 'normal';
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
      stopClockSync?.();
      stopClockSync = null;
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

  const handleSendChatMessage = (text: string) => {
    if (!socket || !isConnected) return;
    if (!GameState.localPlayerId) return;

    enqueueChatMessage(GameState.localPlayerId, text, performance.now());
    socket.emit('chat', { type: 'chat', message: text });
    setMessagesSent((prev) => prev + 1);
  };

  const handleReturnToLobby = () => {
    socket?.disconnect();
    setGameLoopSocket(null);
    window.location.href = '/';
  };

  return (
    <>
      <Map keyBindings={keyBindings} />
      <div className="fixed top-0 right-0 left-0 z-50 border-b border-[#1f3b2b]/80 bg-[#020b06]/90 p-4 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-4 text-sm text-[#e7fdf5]/90">
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
            <button
              onClick={() => setIsDebugOpen((prev) => !prev)}
              className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                isDebugOpen
                  ? 'bg-[#0b1a12]/80 text-[#e7fdf5] hover:bg-[#0b1a12]'
                  : 'bg-[#1f3b2b] text-[#e7fdf5] hover:bg-[#2a523c]'
              }`}
              type="button"
            >
              {isDebugOpen ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">Socket.IO Connection</h2>
          </div>
          <div className="space-y-1 text-right">
            <p>Last tick: {lastTick ? new Date(lastTick).toLocaleTimeString() : 'None'}</p>
          </div>
        </div>
      </div>

      <div className="fixed top-[84px] left-4 z-50 flex items-center gap-3 text-sm text-[#e7fdf5]">
        <span className="font-semibold">HP</span>
        <div className="h-3 w-44 overflow-hidden rounded border border-[#1f3b2b]/60 bg-[#0b1a12]/80">
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${Math.max(0, (localHealth / PLAYER_MAX_HEALTH) * 100)}%` }}
          />
        </div>
        <span className="w-10 text-right">{localHealth}</span>
      </div>

      <div className="fixed top-[124px] left-4 z-40">
        <Leaderboard />
      </div>

      <div className="pointer-events-none fixed bottom-4 left-4 z-40">
        <MiniMap />
      </div>

      {isDebugOpen && (
        <div className="fixed right-4 bottom-4 z-40">
          <DebugInfo
            title="Connection Details"
            items={[
              { label: 'Socket ID', value: `${socket?.id?.slice(0, 8)}...` },
              { label: 'Server Tick', value: serverTick, color: 'info' },
              { label: 'Transport', value: transportName ?? 'N/A' },
              {
                label: 'RTT (EMA)',
                value: GameState.net.smoothedRttMs ? `${Math.round(GameState.net.smoothedRttMs)}ms` : '—',
              },
              {
                label: 'Clock Offset',
                value: GameState.net.smoothedRttMs ? `${Math.round(GameState.net.clockOffsetMs)}ms` : '—',
              },
              { label: 'Interp Delay', value: `${Math.round(GameState.net.interpDelayMs)}ms` },
              {
                label: 'Remote Buffers',
                value: remoteBufferStats
                  ? `n=${remoteBufferSizes.length} min=${remoteBufferStats.min} avg=${remoteBufferStats.avg.toFixed(
                      1
                    )} max=${remoteBufferStats.max}`
                  : 'n=0',
              },
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
      )}

      <div className="fixed top-1/4 left-1/2 z-40 -translate-x-1/2">
        {isChatOpen && (
          <Chat
            isOpen={isChatOpen}
            isConnected={isConnected}
            onClose={() => setIsChatOpen(false)}
            onSendMessage={handleSendChatMessage}
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
