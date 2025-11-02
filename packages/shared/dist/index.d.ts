export declare const TICK_RATE = 20;
export declare const MAP_GRID_CELL_SIZE = 32;
export declare const MAP_GRID_DOT_SIZE = 2;
export declare const MAP_GRID_COLOR = "#ffffff";
export declare const MAP_BORDER_COLOR = "#ffffff";
export declare const MAP_BORDER_WIDTH = 2;
export declare const MAP_OUTSIDE_COLOR = "#1a1a1a";
export declare const MAP_HEADER_HEIGHT = 73;
export declare const MAP_WIDTH = 10000;
export declare const MAP_HEIGHT = 10000;
export declare const PLAYER_RADIUS = 16;
export declare const PLAYER_COLOR = "#3b82f6";
export declare const PLAYER_SPEED = 200;
export type PlayerData = {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
};
export type ClientMessage = {
    type: 'ok';
} | {
    type: 'chat';
    message: string;
} | {
    type: 'join';
    name: string;
} | {
    type: 'position';
    x: number;
    y: number;
};
export type ServerMessage = {
    type: 'tick';
    timestamp: number;
} | {
    type: 'chat';
    message: string;
    from?: string;
} | {
    type: 'snapshot';
    players: PlayerData[];
    timestamp: number;
};
//# sourceMappingURL=index.d.ts.map