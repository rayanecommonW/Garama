# Work still in Progress


# 🕹️ Garama - Multiplayer .io Game

A real-time multiplayer game built with modern web technologies, featuring smooth movement, WebSocket communication, and a scalable monorepo architecture.

Preview : Is Coming Soon

## 🌟 Features

- **Real-time Multiplayer**: WebSocket-based communication for instant gameplay
- **Smooth Movement**: 20Hz game loop with client-side prediction
- **Scalable Architecture**: Monorepo with shared type system
- **Modern Tech Stack**: Next.js, Bun, Hono, TypeScript, Turborepo
- **Cross-platform**: Works on desktop and mobile browsers

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

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd garama
   ```

2. **Install dependencies**
   ```bash
   cd backend
   bun i

   cd frontend
   npm i
   ```

3. **Start development servers**
   ```bash
   npm run dev  # Runs both frontend + backend
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

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
```bash
# Add Prisma + PostgreSQL
bun add prisma @prisma/client
bun add -D prisma
```

#### 2. **Authentication System**
```bash
# Add NextAuth.js
bun add next-auth
```

#### 3. **State Management Enhancement**
```bash
# Add Redux Toolkit or Zustand middleware
bun add @reduxjs/toolkit
# or
bun add immer
```

#### 5. **Game Analytics**
```bash
# Add monitoring & analytics
bun add @vercel/analytics
bun add winston # Logging
```

#### 7. **Performance Monitoring**
```bash
# Add performance tracking
bun add @sentry/nextjs
bun add web-vitals
```

### Infrastructure & Deployment

TO-DO : Front in vercel, Backend in Docker

## 📈 Scaling Considerations

### Horizontal Scaling
- **Load Balancer**: Nginx/Traefik for backend distribution
- **Redis**: Shared session store for WebSocket state
- **Database**: Connection pooling for high concurrency

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
