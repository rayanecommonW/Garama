import type { Point } from './index';

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function pointToSegmentDistance(point: Point, segmentStart: Point, segmentEnd: Point): number {
  const [px, py] = point;
  const [x1, y1] = segmentStart;
  const [x2, y2] = segmentEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

export function circlePolygonCollision(center: Point, radius: number, polygon: Point[]): boolean {
  if (pointInPolygon(center, polygon)) {
    return true;
  }

  for (let i = 0; i < polygon.length; i++) {
    const start = polygon[i];
    const end = polygon[(i + 1) % polygon.length];
    const distance = pointToSegmentDistance(center, start, end);

    if (distance <= radius) {
      return true;
    }
  }

  return false;
}

export function resolveCirclePolygonCollision(
  center: Point,
  radius: number,
  polygon: Point[]
): Point {
  const [cx, cy] = center;
  let minDistance = Infinity;
  let pushX = 0;
  let pushY = 0;

  const isInside = pointInPolygon(center, polygon);

  if (isInside) {
    for (let i = 0; i < polygon.length; i++) {
      const start = polygon[i];
      const end = polygon[(i + 1) % polygon.length];
      const [x1, y1] = start;
      const [x2, y2] = end;

      const edgeDx = x2 - x1;
      const edgeDy = y2 - y1;
      const edgeLength = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);
      const normalX = -edgeDy / edgeLength;
      const normalY = edgeDx / edgeLength;

      const distance = pointToSegmentDistance(center, start, end);

      if (distance < minDistance) {
        minDistance = distance;
        const pushDistance = radius - distance + 1;
        pushX = normalX * pushDistance;
        pushY = normalY * pushDistance;
      }
    }
  } else {
    for (let i = 0; i < polygon.length; i++) {
      const start = polygon[i];
      const end = polygon[(i + 1) % polygon.length];
      const [x1, y1] = start;
      const [x2, y2] = end;

      const distance = pointToSegmentDistance(center, start, end);

      if (distance <= radius && distance < minDistance) {
        minDistance = distance;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        let t = ((cx - x1) * dx + (cy - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;

        const dirX = cx - closestX;
        const dirY = cy - closestY;
        const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);

        if (dirLength > 0) {
          const pushDistance = radius - distance + 1;
          pushX = (dirX / dirLength) * pushDistance;
          pushY = (dirY / dirLength) * pushDistance;
        }
      }
    }
  }

  return [pushX, pushY];
}

export function checkCircleMovementCollision(
  from: Point,
  to: Point,
  radius: number,
  polygon: Point[]
): boolean {
  if (circlePolygonCollision(to, radius, polygon)) {
    return true;
  }

  const [x1, y1] = from;
  const [x2, y2] = to;
  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const steps = Math.ceil(distance / (radius / 2));

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const checkPoint: Point = [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
    if (circlePolygonCollision(checkPoint, radius, polygon)) {
      return true;
    }
  }

  return false;
}
