# Roadmap: ECS & Collision Architecture

## 1. Entity Component System (ECS)
To maintain performance and cleaner networking with Bun/TS, we avoid deep inheritance hierarchies (`class Player extends Character`).

### Core Concepts
- **Entity**: Just a unique ID (e.g., `123`).
- **Component**: Pure Data (e.g., `Position { x, y }`, `Velocity { vx, vy }`).
- **System**: Logic that iterates over entities with specific components.

### Benefits
- **Networking**: We serialize Arrays of Components (SOA) or simple component lists. `JSON.stringify(positionComponents)` is fast; binary serialization is even faster.
- **Composition**: Entities can be anything by mixing components. A "Projectile" is just `Position + Velocity + Hitbox`.

## 2. Collision Strategy: "Lightweight & Precise"

### Library Recommendation: `detect-collisions`
- **Reason**: Optimized Bounding Volume Hierarchy (BVH).
- **Complexity**: Reduces collision checks from $O(N^2)$ to $O(N \log N)$.
- **Role**: Handles the *broad phase* (finding pairs) and *narrow phase* (SAT/overlap). We handle the *resolution*.

### The "Trash" Fix: AABB Separation
For a Metroidvania, we don't need heavy physics (Matter.js). We need **AABB (Axis-Aligned Bounding Box)** with **Separation**.

**Algorithm (Minkowski Difference Approach):**
1.  Calculate center distance: `dx` and `dy`.
2.  Calculate combined half-extents.
3.  **Check**: `abs(dx) < combinedWidth` AND `abs(dy) < combinedHeight`.
4.  **Resolution**:
    - Determine the axis of *least penetration*.
    - Push the entity out along that axis.
    - Zero out velocity on that axis.

### Implementation Pattern
```typescript
import { System } from 'detect-collisions';

const physics = new System();
// Create bodies...

physics.checkAll((response) => {
    // Push player out of wall
    if (response.a.isStatic) return; // Don't move walls
    
    response.a.x -= response.overlapV.x;
    response.a.y -= response.overlapV.y;
});
```

## 3. Systems Integration
- **MovementSystem**: Updates `x, y` based on `vx, vy`.
- **CollisionSystem**: Syncs physics bodies with ECS positions, runs `checkAll`, applies resolution, updates ECS positions.

