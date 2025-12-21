/**
 * Parallax layer configuration for the mossy forest biome.
 * Defines 6 depth layers with their parallax factors and color palettes.
 */

export type ParallaxLayerId =
  | 'distantRocks'
  | 'mossyHills'
  | 'farTrees'
  | 'nearTrees'
  | 'plants'
  | 'foregroundVines';

export type ParallaxLayerConfig = {
  id: ParallaxLayerId;
  name: string;
  parallaxFactor: number; // 0 = static, 1 = moves with camera
  tileWidth: number;
  tileHeight: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    shadow: string;
  };
  opacity: number;
  seed: number; // For deterministic procedural generation
};

/**
 * Mossy forest biome color palette.
 */
export const BIOME_COLORS = {
  // Deep background colors
  deepMossGreen: '#1a2e1a',
  darkForestGreen: '#0d1f0d',
  mistGray: '#2a3a2a',

  // Mid-ground colors
  forestGreen: '#2d4a2d',
  mossGreen: '#3d5c3d',
  fernGreen: '#4a6b4a',

  // Foreground colors
  vibrantMoss: '#5a7d5a',
  leafGreen: '#6b8f6b',
  brightFern: '#7aa17a',

  // Accent colors
  darkBrown: '#2d1f1a',
  treeBark: '#3d2a1f',
  rockGray: '#4a4a4a',
  shadowBlack: '#0a0f0a',
};

/**
 * Layer configurations ordered from back to front.
 * Lower index = further back = rendered first.
 */
export const PARALLAX_LAYERS: ParallaxLayerConfig[] = [
  {
    id: 'distantRocks',
    name: 'Distant Rocks',
    parallaxFactor: 0.1,
    tileWidth: 800,
    tileHeight: 600,
    colors: {
      primary: BIOME_COLORS.mistGray,
      secondary: BIOME_COLORS.rockGray,
      accent: BIOME_COLORS.deepMossGreen,
      shadow: BIOME_COLORS.shadowBlack,
    },
    opacity: 0.6,
    seed: 12345,
  },
  {
    id: 'mossyHills',
    name: 'Mossy Hills',
    parallaxFactor: 0.2,
    tileWidth: 600,
    tileHeight: 400,
    colors: {
      primary: BIOME_COLORS.darkForestGreen,
      secondary: BIOME_COLORS.forestGreen,
      accent: BIOME_COLORS.deepMossGreen,
      shadow: BIOME_COLORS.shadowBlack,
    },
    opacity: 0.7,
    seed: 23456,
  },
  {
    id: 'farTrees',
    name: 'Far Trees',
    parallaxFactor: 0.35,
    tileWidth: 400,
    tileHeight: 500,
    colors: {
      primary: BIOME_COLORS.forestGreen,
      secondary: BIOME_COLORS.mossGreen,
      accent: BIOME_COLORS.darkBrown,
      shadow: BIOME_COLORS.darkForestGreen,
    },
    opacity: 0.75,
    seed: 34567,
  },
  {
    id: 'nearTrees',
    name: 'Near Trees',
    parallaxFactor: 0.5,
    tileWidth: 350,
    tileHeight: 450,
    colors: {
      primary: BIOME_COLORS.mossGreen,
      secondary: BIOME_COLORS.fernGreen,
      accent: BIOME_COLORS.treeBark,
      shadow: BIOME_COLORS.forestGreen,
    },
    opacity: 0.8,
    seed: 45678,
  },
  {
    id: 'plants',
    name: 'Plants & Shrubs',
    parallaxFactor: 0.7,
    tileWidth: 300,
    tileHeight: 200,
    colors: {
      primary: BIOME_COLORS.fernGreen,
      secondary: BIOME_COLORS.vibrantMoss,
      accent: BIOME_COLORS.leafGreen,
      shadow: BIOME_COLORS.mossGreen,
    },
    opacity: 0.85,
    seed: 56789,
  },
  {
    id: 'foregroundVines',
    name: 'Foreground Vines',
    parallaxFactor: 0.0, // Static - doesn't move with camera
    tileWidth: 500,
    tileHeight: 400,
    colors: {
      primary: BIOME_COLORS.vibrantMoss,
      secondary: BIOME_COLORS.leafGreen,
      accent: BIOME_COLORS.brightFern,
      shadow: BIOME_COLORS.fernGreen,
    },
    opacity: 0.3, // Semi-transparent overlay
    seed: 67890,
  },
];

/**
 * Get a layer config by ID.
 */
export function getLayerConfig(id: ParallaxLayerId): ParallaxLayerConfig | undefined {
  return PARALLAX_LAYERS.find((layer) => layer.id === id);
}

/**
 * Seeded random number generator for deterministic procedural generation.
 * Uses a simple mulberry32 algorithm.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Calculate the parallax offset for a given camera position and layer.
 * Returns the offset to apply to the layer's position.
 */
export function calculateParallaxOffset(
  cameraX: number,
  cameraY: number,
  parallaxFactor: number
): { offsetX: number; offsetY: number } {
  // Layer offset = camera position * (1 - parallaxFactor)
  // This creates the illusion that layers further away move slower
  const offsetX = cameraX * (1 - parallaxFactor);
  const offsetY = cameraY * (1 - parallaxFactor);
  return { offsetX, offsetY };
}

/**
 * Calculate visible tile range for optimized rendering.
 * Only tiles within the viewport need to be drawn.
 */
export function getVisibleTileRange(
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number,
  tileWidth: number,
  tileHeight: number,
  parallaxFactor: number
): { startTileX: number; endTileX: number; startTileY: number; endTileY: number } {
  const { offsetX, offsetY } = calculateParallaxOffset(cameraX, cameraY, parallaxFactor);

  // Calculate the world-space bounds that are visible
  const visibleLeft = cameraX - viewportWidth / 2 - offsetX;
  const visibleRight = cameraX + viewportWidth / 2 - offsetX;
  const visibleTop = cameraY - viewportHeight / 2 - offsetY;
  const visibleBottom = cameraY + viewportHeight / 2 - offsetY;

  // Convert to tile indices with some padding for seamless scrolling
  const startTileX = Math.floor(visibleLeft / tileWidth) - 1;
  const endTileX = Math.ceil(visibleRight / tileWidth) + 1;
  const startTileY = Math.floor(visibleTop / tileHeight) - 1;
  const endTileY = Math.ceil(visibleBottom / tileHeight) + 1;

  return { startTileX, endTileX, startTileY, endTileY };
}


