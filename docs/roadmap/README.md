# Game Implementation Roadmap

This directory contains the architectural guidelines and implementation roadmap for the Garama PvP Metroidvania engine.

## Core Systems

1.  [Physics & Game Loop](./01_PHYSICS_LOOP.md)
    - Fixed Timestep Accumulator
    - Decoupled Rendering
2.  [ECS & Collision](./02_ECS_COLLISION.md)
    - Entity Component System
    - `detect-collisions` Integration
    - AABB Separation Logic
3.  [Combat & Networking](./03_COMBAT_NETWORKING.md)
    - Hitbox/Hurtbox Architecture
    - Server Authority & Lag Compensation (Rewind)
4.  [Game Feel & Camera](./04_GAME_FEEL_CAMERA.md)
    - Procedural Squash & Stretch
    - Particles & Hit Stop
    - Smart 2D Camera
5.  [AI & Progression](./05_AI_PROGRESSION.md)
    - Finite State Machines
    - Utility-based Progression
    - "Fake Socket" Bots
6.  [Level Design](./06_LEVEL_DESIGN.md)
    - Arena Flow
    - LDtk Integration
7.  [Rendering Choice](./07_RENDERING_CHOICE.md)
    - PixiJS (Performance Choice)
8.  [Clock Synchronization](./08_CLOCK_SYNC.md)
    - NTP-like exchanges
    - Latency filtering
    - Snapshot interpolation
9.  [Performance & Optimization](./09_PERFORMANCE.md)
    - Object Pooling (GC fix)
    - Sub-pixel Rendering
    - Texture Atlases
10. [Advanced Gameplay Systems](./10_ADVANCED_GAMEPLAY.md)
    - Boss HFSM ("The Tell" Architecture)
    - Narrative Flags
    - Raycasting for Anti-Tunneling
11. [Parallax Background](./11_PARALLAX.md)
    - Multi-layer scroll-factor model
    - Offscreen-canvas baking
    - Safe modulo wrap & seeded PRNG
    - Per-frame animation for moving layers (water, etc.)
12. [Parallax Sprite Assets](./12_PARALLAX_ASSETS.md) (design only)
    - `sprite` and `spriteSheet` layer kinds
    - Asset folder layout, async load contract
    - When to prefer procedural vs sprite
13. [Map Border & Beyond-Border Frame](./13_MAP_BORDER.md)
    - Brick tile + cavalier shear for the area outside the world rect
    - Inner-shadow + edge line frame on the visible world borders

## Usage

Follow these documents sequentially to build the engine's core foundation before moving to gameplay content.
