# Roadmap: Level Design & Tooling

## 1. The Arena Flow
For PvP Metroidvania, the map is an **Arena**, not a linear level.

### Key Elements
- **Loops**: Players must be able to run in circles. Dead ends = Death.
- **Verticality**: Breaking line of sight is crucial to prevent "sniper" meta.
- **One-Way Platforms**: Allow quick escapes upward; force commitment when dropping down.

## 2. Tooling: The "Workflow" Choice (LDtk)

### LDtk (Level Designer Toolkit) + Raw Canvas

- **Type**: External Tool (Level Editor)
- **Weight**: 0kb (It's a dev tool, not a library)

### Analysis
- **Pros**:
    - **Solves the main pain point directly**: You keep your current custom engine but stop writing JSON manually.
    - LDtk exports "Simple JSON" that defines where your platforms are.
- **Cons**:
    - Requires writing a simple "Loader" script once.

### Verdict
**Highly Recommended.** This allows you to keep your engine lightweight while getting a AAA-grade level editor.

### Workflow
1.  **Design**: Create map in LDtk (`.ldtk` file).
2.  **Export**: Export to JSON/Simples format.
3.  **Load**:
    - **Server**: Loads collisions (AABB) and NavMesh/Entity Spawns.
    - **Client**: Loads tilemaps for rendering.
4.  **Sync**: Server sends "Map ID" to client; client loads corresponding assets.

### Integration Steps
- Parse LDtk JSON.
- Convert "Entities" layer to `ECS` spawn commands.
- Convert "IntGrid" (Collision layer) to `detect-collisions` bodies (static).

