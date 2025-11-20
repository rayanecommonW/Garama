# Work still in Progress


# 🕹️ Garama - Multiplayer .io Game

Multiplayer game ,  smooth movement, WebSocket ,  monorepo .

Preview : [Preview here](https://garama-five.vercel.app)

## 🌟 Features

- TO-DO

## 🏗️ Architecture

### Project Structure

```
garama-monorepo/
├── packages/
│   └── shared/           # Shared types & constants
├── backend/              # Game server (Bun + Hono)
├── frontend/             # Game client (Next.js + React)
└── turbo.json           # Monorepo configuration
```

### Communication Flow

```
Frontend (React) ↔ WebSocket ↔ Backend (Bun/Hono)
     ↓                       ↓              ↓
Input Events → Direction Msg → Process Input → Update Physics
     ↓                       ↓              ↓
UI Updates ← Game State ← Broadcast ← 20Hz Game Loop
```

## 🚀 Quick Start

### Prerequisites

- **Bun**
- **Git**
- **Turbo Repo**

### Alternative Commands

```bash
# Run only backend
npm run dev:backend

# Run only frontend
npm run dev:frontend

# Build for production
npm run build
```

## 🎮 How to Play

1. **Join the Game**: Enter your player name and click join
2. **Move Around**: Use WASD or Arrow keys to move your character
3. **Real-time Action**: See other players move in real-time
4. **Smooth Experience**: 60fps rendering with 20Hz authoritative server updates

## 🛠️ Technology Stack
Will move either to Go or native Websocket soon

### Core Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 15 + React 19 | UI framework with App Router |
| **Backend** | Bun + Hono | Fast runtime + lightweight web framework |
| **WebSocket** | Socket.io| Real-time bidirectional communication |
| **Monorepo** | Turborepo | Build system and task orchestration |
| **Language** | TypeScript | Type safety across entire stack |
| **Styling** | Tailwind CSS | Utility-first CSS framework |

### Shared Architecture

- **`@garama/shared`**: Centralized types and game constants
- **Type Safety**: End-to-end TypeScript with shared interfaces
- **Hot Reload**: Development with fast refresh on both client/server

## 📁 Project Structure Details

TO-DO

## 🔧 Development

### Code Quality

TO-DO : ESLint, Prettier

### Game Mechanics

TO-DO

### Road-Map

#### 1. **Database Integration**
TO-DO

#### 2. **Authentication System**
TO-DO
```bash
bun add next-auth
```

#### 3. **State Management Enhancement**
TO-DO
```bash
bun add @reduxjs/toolkit
# or
bun add immer
```

#### 5. **Game Analytics**
TO-DO

#### 7. **Performance Monitoring**
TO-DO

### Infrastructure & Deployment
Vercel+Railway for now but might change the backend when i burned all my tokens


## AI generated recomendation

### Performance Optimizations
- **WebWorkers**: Offload heavy computations
- **Service Workers**: Cache game assets
- **CDN**: Distribute static assets globally

### Monitoring & Observability
- **Application Metrics**: Response times, error rates
- **System Metrics**: CPU, memory, network usage
- **Business Metrics**: DAU, retention, engagement


## 📄 License
TO-DO

---


*Have questions or want to help me? Please open a discussion !* 
