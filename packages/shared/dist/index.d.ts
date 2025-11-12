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
/**
 * Gravity and jump tuning (pixels, seconds)
 */
export declare const GRAVITY = 2000;
export declare const JUMP_INITIAL_SPEED = 700;
export declare const JUMP_HOLD_ACCEL = 1200;
export declare const JUMP_MAX_HOLD_MS = 180;
export declare const MAX_FALL_SPEED = 1400;
export declare const DEBUG_HITBOX_COLOR = "#ff0000";
export declare const DEBUG_PLAYER_HITBOX_COLOR = "#ffff00";
export type Point = [number, number];
export type RenderStyle = 'stone-wall' | 'wooden-barrier' | 'metal';
export type StaticObject = {
    id: string;
    polygon: Point[];
    renderStyle: RenderStyle;
};
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
    serverTick: number;
};
export declare const STATIC_OBJECTS: StaticObject[];
export { pointInPolygon, circlePolygonCollision, resolveCirclePolygonCollision, checkCircleMovementCollision, } from './collision';
//# sourceMappingURL=index.d.ts.map