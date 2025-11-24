# Roadmap: AI & Progression

## 1. Animation: Finite State Machine (FSM)
Avoid "boolean hell" (`isJumping`, `isRunning`). Use a strict FSM.

### States
- `IDLE`
- `RUN`
- `JUMP`
- `ATTACK`
- `STUNNED`

### Logic
- Only strictly valid transitions allowed (e.g., can't go `ATTACK` -> `RUN` directly if attack has recovery frames).
- **Visual Separation**: Logic updates strict coordinates; Renderer interpolates visual position.

## 2. Progression: Utility > Stats
Avoid "Level 50 vs Level 1" stat checks. Progression should be **mechanical**.

### The Metroidvania Curve
- **Start**: Jump, Sword.
- **Upgrade 1**: Double Jump (Verticality + Dodging).
- **Upgrade 2**: Dash/Phase Shift (i-frames).
- **Upgrade 3**: Wall Cling/Jump.

### Data Structure
Store "Loadouts" and "Unlocks", not raw stats.
```json
{
  "userId": "123",
  "unlockedAbilities": ["double_jump", "dash"],
  "hp": 100 // Standardized
}
```

## 3. Server-Side Bots: "Fake Socket" Pattern
Do not write separate AI simulation code. Trick the engine.

### Implementation
1.  **BotConnection**: A class that mocks the WebSocket interface (`send()`, `on()`).
2.  **Loop**:
    - Bot receives "snapshot" (just like a client).
    - Bot runs internal logic (Steering Behaviors).
    - Bot generates "input" packet (`{ type: 'MOVE_RIGHT' }`).
    - Bot calls `serverEngine.handleInput(botId, input)`.
3.  **AI Logic**:
    - **Steering**: Seek, Wander.
    - **State**: Patrol -> Chase (Line of Sight) -> Attack (Range).
    - **Performance**: Don't A* every frame. Use simple vector math.

