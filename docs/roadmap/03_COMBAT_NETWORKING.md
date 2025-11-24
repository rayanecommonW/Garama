# Roadmap: Combat & Networking

## 1. Hitbox Architecture
Separate **Navigation** collision from **Combat** collision.

### Definitions
- **Hurtbox (Green)**: The area where a player *takes* damage. Slightly smaller than the sprite. Always active (unless invincible).
- **Hitbox (Red)**: The area where an attack *deals* damage. Ephemeral; exists only during specific animation frames.

### Frame Data Structure
Define attacks as data, not code.
```typescript
export const SWORD_ATTACK = {
    totalDuration: 30, // ticks
    damage: 10,
    phases: [
        { frame: 0, type: 'startup' },
        { frame: 5, type: 'active', rect: { x: 20, y: -10, w: 40, h: 50 } },
        { frame: 15, type: 'recovery' }
    ]
};
```

## 2. Server Authority & Protocol
Trust the server for hit registration to prevent cheating.

### The Flow
1.  **Client**: Sends `{ type: 'ATTACK_START', id: 'sword_1', tick: 100 }`.
2.  **Server**:
    - Validates state (cooldowns, not stunned).
    - Sets player state to `ATTACKING`.
3.  **Server Loop**:
    - At `tick + 5` (active frame), Server creates the Hitbox.
    - Server checks overlap: `Hitbox` vs `EnemyHurtbox`.
4.  **Resolution**:
    - If hit: Deduct HP.
    - Broadcast: `{ type: 'DAMAGE_TAKEN', targetId: 'P2', amount: 10 }`.

## 3. Lag Compensation (Rewind)
Since clients see the past, the server must check collisions *in the past*.

**Mechanism:**
- Server maintains a **Circular Buffer** of player positions for the last ~1 second.
- When processing an attack that occurred at `Tick T` (calculated via `ServerTick - RTT/2`), the server "rewinds" victim positions to `Tick T` before checking collisions.
- This ensures "I shot him on my screen" usually results in a hit.

## 4. Projectiles
- Projectiles are separate Entities with `Velocity` and `Hitbox`.
- They are just "moving hitboxes".

