# Roadmap: Physics & Game Loop Architecture

## 1. The Problem: "Dt" Inconsistency
In standard apps, we react to events. In games, we simulate time. Moving characters by `speed * deltaTime` leads to:
- **Tunneling**: Players teleporting through walls during lag spikes.
- **Inconsistency**: Physics behavior varying with frame rate.

## 2. The Solution: Fixed Timestep (Accumulator Pattern)
We must decouple the **Rendering Loop** (variable Hz) from the **Physics Loop** (fixed 60Hz).

### Implementation Strategy

**Constants:**
- `PHYSICS_STEP`: 16.66ms (60Hz)
- `MAX_ACCUMULATOR`: Prevent spiral of death (e.g., clamp at 100ms)

**The Loop Structure:**
1.  **Input**: Capture input state.
2.  **Accumulate**: Add `deltaTime` (time since last frame) to an `accumulator`.
3.  **Physics Step (Fixed)**:
    - While `accumulator >= PHYSICS_STEP`:
        - Run physics simulation (movement, collision).
        - Decrement `accumulator` by `PHYSICS_STEP`.
        - **Crucial**: Physics engine sees a constant `dt` (never variable).
4.  **Render (Interpolated)**:
    - Calculate `alpha = accumulator / PHYSICS_STEP`.
    - Render entities interpolated between `previousState` and `currentState` by `alpha`.
    - This eliminates jitter even if the screen is 144Hz and physics is 60Hz.

## 3. Implementation Details

```typescript
const PHYSICS_STEP = 1000 / 60; // 16.66ms
let accumulator = 0;
let lastTime = performance.now();

function gameLoop(currentTime: number) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    accumulator += deltaTime;

    // Catch up on physics
    while (accumulator >= PHYSICS_STEP) {
        updatePhysics(PHYSICS_STEP); // Fixed delta!
        accumulator -= PHYSICS_STEP;
    }

    // Render slightly into the future (interpolation) for smoothness
    const alpha = accumulator / PHYSICS_STEP;
    render(alpha);

    requestAnimationFrame(gameLoop);
}
```

## 4. Key Takeaways
- **Never** use variable `deltaTime` for physics integration.
- **Always** use `requestAnimationFrame` for the driver.
- **Interpolate** rendering for visual smoothness.

