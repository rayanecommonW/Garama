# Roadmap: Rendering Architecture

## 1. The "Performance" Choice: PixiJS (v8)

- **Type**: 2D Rendering Library (Not a full engine)
- **Weight**: Modular (Core is ~60kb gzip, full is larger)

### Analysis
- **Pros**:
    - Industry standard with incredible performance (WebGL).
    - Modular: Can use *only* `@pixi/core` and `@pixi/sprite` to keep it light.
    - Excellent TypeScript support.
- **Cons**:
    - Heavier than raw canvas.
    - Creates a scene graph which might be overkill if you just want to blast pixels to a screen.

### Verdict
**Best if you want the game to look professional** (lighting, shaders, particles) without building those systems yourself. While Canvas2D is lighter, PixiJS provides a robust path for visual scaling.

