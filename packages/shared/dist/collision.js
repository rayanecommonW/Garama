/**
 * Checks if a point is inside a polygon using ray casting algorithm
 */
export function pointInPolygon(point, polygon) {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect)
            inside = !inside;
    }
    return inside;
}
/**
 * Calculates the distance from a point to a line segment
 */
function pointToSegmentDistance(point, segmentStart, segmentEnd) {
    const [px, py] = point;
    const [x1, y1] = segmentStart;
    const [x2, y2] = segmentEnd;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
        // Segment is a point
        return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }
    // Calculate projection of point onto line segment
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}
/**
 * Checks if a circle collides with a polygon
 */
export function circlePolygonCollision(center, radius, polygon) {
    const [cx, cy] = center;
    // Check if center is inside polygon
    if (pointInPolygon(center, polygon)) {
        return true;
    }
    // Check if circle intersects any edge
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
/**
 * Resolves circle-polygon collision by returning a push-out vector
 * Returns [dx, dy] to move the circle out of collision
 */
export function resolveCirclePolygonCollision(center, radius, polygon) {
    const [cx, cy] = center;
    let minDistance = Infinity;
    let pushX = 0;
    let pushY = 0;
    // Check if center is inside polygon
    const isInside = pointInPolygon(center, polygon);
    if (isInside) {
        // Find the closest edge and push away from it
        for (let i = 0; i < polygon.length; i++) {
            const start = polygon[i];
            const end = polygon[(i + 1) % polygon.length];
            const [x1, y1] = start;
            const [x2, y2] = end;
            // Calculate normal to the edge (pointing outward)
            const edgeDx = x2 - x1;
            const edgeDy = y2 - y1;
            const edgeLength = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);
            const normalX = -edgeDy / edgeLength;
            const normalY = edgeDx / edgeLength;
            // Distance from point to line segment
            const distance = pointToSegmentDistance(center, start, end);
            if (distance < minDistance) {
                minDistance = distance;
                // Push out by (radius - distance) plus small margin
                const pushDistance = radius - distance + 1;
                pushX = normalX * pushDistance;
                pushY = normalY * pushDistance;
            }
        }
    }
    else {
        // Circle is outside but intersecting - find closest point and push away
        for (let i = 0; i < polygon.length; i++) {
            const start = polygon[i];
            const end = polygon[(i + 1) % polygon.length];
            const [x1, y1] = start;
            const [x2, y2] = end;
            const distance = pointToSegmentDistance(center, start, end);
            if (distance <= radius && distance < minDistance) {
                minDistance = distance;
                // Calculate direction from closest point on edge to circle center
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
/**
 * Checks if moving a circle from one position to another would collide with a polygon
 * Returns true if collision would occur
 */
export function checkCircleMovementCollision(from, to, radius, polygon) {
    // Check collision at destination
    if (circlePolygonCollision(to, radius, polygon)) {
        return true;
    }
    // Check intermediate positions for tunneling prevention
    const [x1, y1] = from;
    const [x2, y2] = to;
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const steps = Math.ceil(distance / (radius / 2));
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const checkPoint = [
            x1 + (x2 - x1) * t,
            y1 + (y2 - y1) * t
        ];
        if (circlePolygonCollision(checkPoint, radius, polygon)) {
            return true;
        }
    }
    return false;
}
