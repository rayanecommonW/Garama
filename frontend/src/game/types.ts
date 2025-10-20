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

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';
