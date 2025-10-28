# 🕹️ Garama - Multiplayer .io Game

A real-time multiplayer game built with modern web technologies, featuring smooth movement, WebSocket communication, and a scalable monorepo architecture.

![Game Preview](https://via.placeholder.com/800x400/1a1a2e/ffffff?text=Garama+.io+Game)

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

- **Bun** (recommended) or Node.js
- **Git**

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd garama
   ```

2. **Install dependencies**
   ```bash
   bun install  # or npm install
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

### Core Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 15 + React 19 | UI framework with App Router |
| **Backend** | Bun + Hono | Fast runtime + lightweight web framework |
| **WebSocket** | Bun WebSocket API | Real-time bidirectional communication |
| **Monorepo** | Turborepo | Build system and task orchestration |
| **Language** | TypeScript | Type safety across entire stack |
| **Styling** | Tailwind CSS | Utility-first CSS framework |

### Shared Architecture

- **`@garama/shared`**: Centralized types and game constants
- **Type Safety**: End-to-end TypeScript with shared interfaces
- **Hot Reload**: Development with fast refresh on both client/server

## 📁 Project Structure Details

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Game page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── GameSimple.tsx # Main game component
│   │   └── Home.tsx      # Landing component
│   ├── hooks/            # Custom React hooks
│   │   ├── useGameSocket.ts # WebSocket connection
│   │   ├── useGameState.ts  # Game state management
│   │   └── useGameRenderer.ts # Canvas rendering
│   ├── stores/           # State management
│   │   └── gameStore.ts  # Zustand store
│   └── game/             # Game-specific code
│       ├── types.ts      # Local type exports
│       └── constants.ts  # Game constants
```

### Backend (`/backend`)

```
backend/
├── src/
│   ├── index.ts          # Main server file
│   └── config.ts         # Server configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

### Shared Package (`/packages/shared`)

```typescript
// Key exports
export type Direction = 'up' | 'down' | 'left' | 'right' | 'stop';
export type PlayerSnapshot = { id: string; name: string; x: number; y: number; /* ... */ };
export type ClientMessage = { type: 'join' | 'input'; /* ... */ };
export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;
export const TICK_RATE = 20;
```

## 🔧 Development

### Code Quality

- **ESLint**: Code linting and formatting
- **TypeScript**: Strict type checking
- **Prettier**: Code formatting (via ESLint)

### Game Mechanics

- **Movement**: WASD/Arrow keys with immediate response
- **Physics**: Authoritative server with client-side prediction
- **Networking**: WebSocket with automatic reconnection
- **State Sync**: 20Hz server broadcasts with delta compression

## 🚀 Recommended Enhancements

### Immediate Additions

#### 1. **Database Integration**
```bash
# Add Prisma + PostgreSQL
bun add prisma @prisma/client
bun add -D prisma
```

**Benefits:**
- Persistent player stats
- Game history/replays
- User accounts & authentication

#### 2. **Authentication System**
```bash
# Add NextAuth.js
bun add next-auth
```

**Features:**
- Social login (Google, GitHub)
- Session management
- Player profiles

#### 3. **State Management Enhancement**
```bash
# Add Redux Toolkit or Zustand middleware
bun add @reduxjs/toolkit
# or
bun add immer
```

**Benefits:**
- Complex game state management
- Undo/redo functionality
- State persistence

### Advanced Features

#### 4. **Real-time Chat**
```bash
# Add Socket.io or custom WebSocket rooms
bun add socket.io
```

**Features:**
- Player communication
- Team coordination
- Moderation tools

#### 5. **Game Analytics**
```bash
# Add monitoring & analytics
bun add @vercel/analytics
bun add winston # Logging
```

**Metrics:**
- Player retention
- Session duration
- Popular game modes

#### 6. **Mobile Optimization**
```bash
# Add touch controls
bun add react-use-gesture
```

**Features:**
- Virtual joystick
- Touch gestures
- Mobile-specific UI

#### 7. **Performance Monitoring**
```bash
# Add performance tracking
bun add @sentry/nextjs
bun add web-vitals
```

**Monitoring:**
- Core Web Vitals
- Error tracking
- Performance bottlenecks

### Infrastructure & Deployment

#### 8. **Containerization**
```dockerfile
# Add Docker support
FROM oven/bun:latest
COPY . .
RUN bun install
EXPOSE 3000 3001
CMD ["bun", "run", "dev"]
```

#### 9. **Cloud Deployment**
```bash
# Deploy to Vercel + Railway
# Frontend: vercel.com
# Backend: railway.app
```

#### 10. **CDN & Asset Optimization**
```bash
# Add image optimization
bun add next/image
bun add sharp
```

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

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure type safety across shared interfaces

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bun**: For the incredible runtime performance
- **Next.js**: For the excellent React framework
- **Hono**: For the lightweight web framework
- **Turborepo**: For seamless monorepo management

---

**Built with ❤️ using modern web technologies**

*Have questions? Open an issue or start a discussion!* 🚀
