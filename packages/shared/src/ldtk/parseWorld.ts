type Point = [number, number];

type LdtkFieldInstance = {
  __identifier?: string;
  __value?: unknown;
};

type LdtkEntityInstance = {
  __identifier?: string;
  iid?: string;
  px?: [number, number];
  width?: number;
  height?: number;
  fieldInstances?: LdtkFieldInstance[];
};

type LdtkLayerInstance = {
  __type?: string;
  __identifier?: string;
  entityInstances?: LdtkEntityInstance[];
};

type LdtkLevel = {
  identifier?: string;
  worldX?: number;
  worldY?: number;
  pxWid?: number;
  pxHei?: number;
  layerInstances?: LdtkLayerInstance[] | null;
};

type LdtkProject = {
  levels?: LdtkLevel[];
};

export type ParsedWorldObject = {
  id: string;
  position: Point;
  width: number;
  height: number;
  renderStyle: string;
  isCollision: boolean;
  zIndex: number;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function asBool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback;
}

function getFieldValue(fields: LdtkFieldInstance[] | undefined, identifier: string) {
  if (!fields) return undefined;
  return fields.find((f) => f.__identifier === identifier)?.__value;
}

/**
 * Parse an LDtk project (or LDtk-like JSON) and extract WorldObject entity instances.
 * Converts LDtk top-left Y+down coordinates into game bottom-left Y+up coordinates.
 */
export function parseWorldObjectsFromLdtk(projectJson: unknown) {
  const project = projectJson as LdtkProject;
  const levels = Array.isArray(project.levels) ? project.levels : [];

  const out: ParsedWorldObject[] = [];

  for (const level of levels) {
    if (!level) continue;
    const levelHeight = isFiniteNumber(level.pxHei) ? level.pxHei : 0;
    const levelWorldX = isFiniteNumber(level.worldX) ? level.worldX : 0;

    const layers = Array.isArray(level.layerInstances) ? level.layerInstances : [];
    for (const layer of layers) {
      if (!layer) continue;
      if (layer.__type !== 'Entities') continue;

      const entities = Array.isArray(layer.entityInstances) ? layer.entityInstances : [];
      for (const entity of entities) {
        if (!entity) continue;
        if (entity.__identifier !== 'WorldObject') continue;

        const width = isFiniteNumber(entity.width) ? entity.width : 0;
        const height = isFiniteNumber(entity.height) ? entity.height : 0;
        const px = Array.isArray(entity.px) ? entity.px : null;
        if (!px) continue;

        const id = asString(getFieldValue(entity.fieldInstances, 'id'), asString(entity.iid, ''));
        if (!id) continue;

        const renderStyle = asString(getFieldValue(entity.fieldInstances, 'renderStyle'), 'stone-wall');
        const isCollision = asBool(getFieldValue(entity.fieldInstances, 'isCollision'), true);
        const zIndexRaw = getFieldValue(entity.fieldInstances, 'zIndex');
        const zIndex = isFiniteNumber(zIndexRaw) ? zIndexRaw : 0;

        // LDtk: px = top-left, Y+down. Game: center position, Y+up.
        const cx = levelWorldX + px[0] + width / 2;
        const cy = levelHeight - (px[1] + height / 2);

        out.push({
          id,
          position: [cx, cy],
          width,
          height,
          renderStyle,
          isCollision,
          zIndex,
        });
      }
    }
  }

  return out;
}


