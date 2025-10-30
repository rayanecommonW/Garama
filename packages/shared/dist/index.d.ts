export declare const TICK_RATE = 20;
export type ClientMessage = {
    type: 'ok';
} | {
    type: 'chat';
    message: string;
};
export type ServerMessage = {
    type: 'tick';
    timestamp: number;
} | {
    type: 'chat';
    message: string;
    from?: string;
};
//# sourceMappingURL=index.d.ts.map