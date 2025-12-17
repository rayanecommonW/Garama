import {
  STATIC_OBJECTS,
  PLAYER_MAX_HEALTH,
  type StaticObject,
  type Point,
  type AttackDirection,
} from '@garama/shared';

export type Player = {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  jumpHoldMs: number;
  radius: number;
  color: string;
  hp: number;
  score: number;
  isDead: boolean;
  isSprinting: boolean;
  hitFlashMs?: number;
  isCharging?: boolean;
  attackHoldStartedAtServerTime?: number | null;
  attackMsLeft?: number;
  attackDir?: AttackDirection;
  attackVariant?: 'normal' | 'charged';
  facing?: AttackDirection;
  dashMsLeft: number;
  dashCooldownMs: number;
  dashDir: AttackDirection;
  canAirDash: boolean;
  sprintJumpBoostMsLeft: number;
  sprintJumpBoostDir: -1 | 1;
};

export type Camera = {
  x: number;
  y: number;
  focusX: number;
  focusY: number;
  lookAheadOffset: number; // Current lerped look-ahead offset in pixels
};

export interface RenderableObject extends StaticObject {
  boundingBox: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export type MouseState = {
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
};

export type NetState = {
  clockOffsetMs: number;
  smoothedRttMs: number;
  interpDelayMs: number;
  remoteSnapshots: Map<string, RemoteSnapshotSample[]>;
  lastSnapshotServerTime: number | null;
  lastSnapshotClientRecvMs: number | null;
};

export type RemoteSnapshotSample = {
  serverTime: number;
  x: number;
  y: number;
};

export type ChatBubble = {
  id: number;
  text: string;
  shownAtMs: number;
};

export type QueuedChatMessage = {
  id: number;
  text: string;
  enqueuedAtMs: number;
};

export type PlayerChatState = {
  queue: QueuedChatMessage[];
  visible: ChatBubble[];
  nextDequeueAtMs: number;
  idCounter: number;
};

export type GameStateType = {
  players: Map<string, Player>;
  localPlayerId: string | null;
  camera: Camera;
  viewportWidth: number;
  viewportHeight: number;
  objects: RenderableObject[];
  debugCollisions: boolean;
  freeCamMode: boolean;
  freeCamZoom: number;
  showCoordinates: boolean;
  mouse: MouseState;
  net: NetState;
  chat: Map<string, PlayerChatState>;
};

function computeBoundingBox(points: Point[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

const objectsWithBounds: RenderableObject[] = STATIC_OBJECTS.map((obj) => ({
  ...obj,
  boundingBox: computeBoundingBox(obj.polygon),
}));

export const GameState: GameStateType = {
  players: new Map<string, Player>(),
  localPlayerId: null,
  camera: { x: 0, y: 0, focusX: 0, focusY: 0, lookAheadOffset: 0 },
  viewportWidth: 0,
  viewportHeight: 0,
  objects: objectsWithBounds,
  debugCollisions: false,
  freeCamMode: false,
  freeCamZoom: 1,
  showCoordinates: false,
  mouse: { screenX: 0, screenY: 0, worldX: 0, worldY: 0 },
  net: {
    clockOffsetMs: 0,
    smoothedRttMs: 0,
    interpDelayMs: 120,
    remoteSnapshots: new Map<string, RemoteSnapshotSample[]>(),
    lastSnapshotServerTime: null,
    lastSnapshotClientRecvMs: null,
  },
  chat: new Map<string, PlayerChatState>(),
};

export function spawnPlayer(
  id: string,
  name: string,
  mapWidth: number,
  mapHeight: number,
  radius: number,
  color: string
): Player {
  const x = 0;
  const y = radius;

  const player: Player = {
    id,
    name,
    x,
    y,
    vx: 0,
    vy: 0,
    onGround: true,
    jumpHoldMs: 0,
    radius,
    color,
    hp: PLAYER_MAX_HEALTH,
    score: 0,
    isDead: false,
    isSprinting: false,
    isCharging: false,
    attackHoldStartedAtServerTime: null,
    attackMsLeft: 0,
    attackVariant: 'normal',
    facing: 'right',
    dashMsLeft: 0,
    dashCooldownMs: 0,
    dashDir: 'right',
    canAirDash: true,
    sprintJumpBoostMsLeft: 0,
    sprintJumpBoostDir: 1,
  };

  GameState.players.set(id, player);

  GameState.camera.x = x;
  GameState.camera.y = y;
  GameState.camera.focusX = x;
  GameState.camera.focusY = y;
  GameState.camera.lookAheadOffset = 0;

  return player;
}
