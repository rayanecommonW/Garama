# Roadmap: Game Feel & Camera

## 1. Procedural Squash & Stretch
Use code, not assets, to make movement feel alive. "Juice" requires zero new sprites.

### The Math
**Conservation of Volume**: `scale.x * scale.y ≈ 1`.
- **Anchor Point**: Must be **Bottom-Center** so feet stay planted.
- **Implementation**:
    - **Jump**: Stretch Y (`>1`), Squash X (`<1`).
    - **Land**: Squash Y (`<1`), Stretch X (`>1`). Snap immediately on impact, then lerp back.
    - **Airborne**: Deform based on vertical velocity.

```typescript
// Example Logic
if (justLanded) {
    scaleY = 0.6; scaleX = 1.6; // Flatten
} else {
    scaleY = lerp(scaleY, 1, 0.1);
    scaleX = lerp(scaleX, 1, 0.1);
}
```

## 2. Hit Stop (The "Crunch")
Freeze the game loop briefly on heavy impacts.
- **Technique**: `if (hitStop > 0) { hitStop--; return; }` inside the game loop.
- **Visual**: Optional screen shake during the freeze.

## 3. Procedural Particles
Draw simple shapes (squares) directly on the canvas.
- **Jump**: Spawn dust at feet.
- **Land**: Shoot dust outwards from feet.
- **Wall Slide**: Emit dust at wall contact.
- **System**: Simple array of `{ x, y, vx, vy, life }`. Update and render in loop.

## 4. Smart 2D Camera
Do not lock strictly to `Player.x`. Give the player "Information Superiority".

### Features
1.  **Focus Point**: A virtual target, not the player.
2.  **Look-Ahead**: Shift Focus Point in the direction the player is facing (`+150px` or `-150px`).
3.  **Deadzone**: Don't move camera for small micro-adjustments.
4.  **Lerp**: Smoothly interpolate Camera position to Focus Point (`factor = 0.1`).
5.  **Clamping**: Never show outside the map bounds.
6.  **Platformer Trap**: Use a vertical deadzone to avoid nausea during continuous jumping.

