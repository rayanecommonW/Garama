export type Direction = 'up' | 'down' | 'left' | 'right' | 'stop';
export type PlayerSnapshot = {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
    vx: number;
    vy: number;
};
export type PlayerState = PlayerSnapshot & {
    lastSeen: number;
};
export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';
export type ClientMessage = {
    type: 'join';
    name?: unknown;
    clientId?: unknown;
} | {
    type: 'input';
    direction?: unknown;
};
export type ServerMessage = {
    type: 'welcome';
    myId: string;
    player: PlayerState;
} | {
    type: 'gameState';
    players: PlayerSnapshot[];
};
export declare const WORLD_WIDTH = 1600;
export declare const WORLD_HEIGHT = 900;
export declare const TICK_RATE = 20;
export declare const PLAYER_SPEED: number;
export declare const INACTIVITY_TIMEOUT = 60000;
//# sourceMappingURL=index.d.ts.map