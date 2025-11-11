import type { Point } from './index';
/**
 * Checks if a point is inside a polygon using ray casting algorithm
 */
export declare function pointInPolygon(point: Point, polygon: Point[]): boolean;
/**
 * Checks if a circle collides with a polygon
 */
export declare function circlePolygonCollision(center: Point, radius: number, polygon: Point[]): boolean;
/**
 * Resolves circle-polygon collision by returning a push-out vector
 * Returns [dx, dy] to move the circle out of collision
 */
export declare function resolveCirclePolygonCollision(center: Point, radius: number, polygon: Point[]): Point;
/**
 * Checks if moving a circle from one position to another would collide with a polygon
 * Returns true if collision would occur
 */
export declare function checkCircleMovementCollision(from: Point, to: Point, radius: number, polygon: Point[]): boolean;
//# sourceMappingURL=collision.d.ts.map