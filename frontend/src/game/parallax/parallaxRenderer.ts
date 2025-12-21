/**
 * Main parallax renderer that orchestrates all parallax layers.
 * Uses tile-based rendering with offscreen canvas caching for performance.
 */

import { renderHillTile } from './layers/hillLayer';
import { renderMountainTile } from './layers/mountainLayer';
import { renderPlantTile } from './layers/plantLayer';
import { renderFarTreeTile, renderNearTreeTile } from './layers/treeLayer';
import { renderVineTile } from './layers/vineLayer';
import { PARALLAX_LAYERS, type ParallaxLayerConfig } from './parallaxConfig';

type TileCache = Map<string, HTMLCanvasElement>;

// Global tile caches for each layer
const tileCaches: Map<string, TileCache> = new Map();

// Maximum tiles to cache per layer to prevent memory issues
const MAX_CACHE_SIZE = 50;

/**
 * Get or create a tile cache for a layer.
 */
function getTileCache(layerId: string): TileCache {
  let cache = tileCaches.get(layerId);
  if (!cache) {
    cache = new Map();
    tileCaches.set(layerId, cache);
  }
  return cache;
}

/**
 * Generate a cache key for a tile.
 */
function getTileCacheKey(tileX: number, tileY: number): string {
  return `${tileX},${tileY}`;
}

/**
 * Render a tile to an offscreen canvas and cache it.
 */
function getOrCreateTile(
  layer: ParallaxLayerConfig,
  tileX: number,
  tileY: number
): HTMLCanvasElement {
  const cache = getTileCache(layer.id);
  const key = getTileCacheKey(tileX, tileY);

  // Check cache first
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  // Create new offscreen canvas for this tile
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = layer.tileWidth;
  tileCanvas.height = layer.tileHeight;
  const tileCtx = tileCanvas.getContext('2d');

  if (tileCtx) {
    // Render the tile based on layer type
    renderTileContent(tileCtx, layer, tileX, tileY);
  }

  // Manage cache size
  if (cache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first key)
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }

  cache.set(key, tileCanvas);
  return tileCanvas;
}

/**
 * Render tile content based on layer type.
 */
function renderTileContent(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  tileX: number,
  tileY: number
): void {
  switch (layer.id) {
    case 'distantRocks':
      renderMountainTile(ctx, layer, tileX, tileY);
      break;
    case 'mossyHills':
      renderHillTile(ctx, layer, tileX, tileY);
      break;
    case 'farTrees':
      renderFarTreeTile(ctx, layer, tileX, tileY);
      break;
    case 'nearTrees':
      renderNearTreeTile(ctx, layer, tileX, tileY);
      break;
    case 'plants':
      renderPlantTile(ctx, layer, tileX, tileY);
      break;
    case 'foregroundVines':
      renderVineTile(ctx, layer, tileX, tileY);
      break;
  }
}

/**
 * Render a single parallax layer.
 * Parallax layers tile infinitely and move slower than the camera based on their parallax factor.
 */
function renderLayer(
  ctx: CanvasRenderingContext2D,
  layer: ParallaxLayerConfig,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  ctx.save();
  ctx.globalAlpha = layer.opacity;

  // Calculate how much the layer is offset due to parallax
  // parallaxFactor 0 = static (doesn't move), 1 = moves with camera
  const parallaxX = cameraX * layer.parallaxFactor;
  const parallaxY = cameraY * layer.parallaxFactor;

  // Calculate which tiles are visible
  // The layer's effective position in screen space
  const offsetX = -parallaxX;
  const offsetY = parallaxY; // Y doesn't need inversion for tiling

  // Find tile range that covers the viewport
  const startTileX = Math.floor((parallaxX - viewportWidth / 2) / layer.tileWidth) - 1;
  const endTileX = Math.ceil((parallaxX + viewportWidth / 2) / layer.tileWidth) + 1;
  const startTileY = Math.floor((-parallaxY - viewportHeight / 2) / layer.tileHeight) - 1;
  const endTileY = Math.ceil((-parallaxY + viewportHeight / 2) / layer.tileHeight) + 1;

  // Render visible tiles
  for (let tileX = startTileX; tileX <= endTileX; tileX++) {
    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      const tile = getOrCreateTile(layer, tileX, tileY);

      // Calculate screen position: tile world pos + parallax offset + center viewport
      const screenX = tileX * layer.tileWidth + offsetX + viewportWidth / 2;
      const screenY = -(tileY * layer.tileHeight) + offsetY + viewportHeight / 2;

      ctx.drawImage(tile, screenX, screenY);
    }
  }

  ctx.restore();
}

/**
 * Render all parallax background layers.
 * Should be called before game world rendering.
 */
export function renderParallaxBackground(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  // Render layers from back to front (excluding foreground vines)
  for (let i = 0; i < PARALLAX_LAYERS.length - 1; i++) {
    const layer = PARALLAX_LAYERS[i];
    renderLayer(ctx, layer, cameraX, cameraY, viewportWidth, viewportHeight);
  }
}

/**
 * Render foreground parallax elements (vines overlay).
 * Should be called after game world rendering but before UI.
 */
export function renderParallaxForeground(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  const foregroundLayer = PARALLAX_LAYERS[PARALLAX_LAYERS.length - 1];
  if (foregroundLayer && foregroundLayer.id === 'foregroundVines') {
    renderLayer(ctx, foregroundLayer, cameraX, cameraY, viewportWidth, viewportHeight);
  }
}

/**
 * Clear all tile caches. Call on viewport resize or when memory is needed.
 */
export function clearParallaxCache(): void {
  tileCaches.forEach((cache) => cache.clear());
}

