# UNO Online (Multiplayer)

Real-time multiplayer UNO built with Next.js, Socket.IO, TypeScript, Tailwind CSS, Framer Motion, and Zustand.

## What this game includes

- Create and join rooms with a 6-character room code
- Lobby with host-controlled settings:
  - max players (2-10)
  - turn timer (off / 15 / 30 / 60 seconds)
  - bot difficulty (easy / medium / hard)
  - variants (stacking, jump-in, seven-0 toggles in settings UI)
- Automatic bot fill when starting a match
- Real-time turn-based gameplay over Socket.IO
- UNO call and UNO catch penalty
- Round end + cumulative scoring board + rematch flow

## Tech stack

- Next.js 16 (App Router) + React 19
- Custom Node server (`server.ts`) for Next + Socket.IO in one process
- Socket.IO (`socket.io`, `socket.io-client`)
- Zustand state store
- Tailwind CSS v4 + Framer Motion

## Project structure (important files)

- `server.ts`: custom HTTP server + Next request handler + Socket.IO bootstrap
- `src/lib/socket/server.ts`: Socket.IO event handlers and game flow
- `src/lib/game/*`: deck generation, rules, room manager, bot logic
- `src/hooks/useSocket.ts`: client socket event wiring
- `src/hooks/useGameState.ts`: global client state
- `src/app/page.tsx`: create/join landing page
- `src/app/room/[code]/page.tsx`: lobby/game/game-over entry

## Run locally

### 1) Prerequisites

- Node.js 20+ recommended
- `pnpm` (repo uses `pnpm-lock.yaml`)

### 2) Install dependencies

```bash
pnpm install
```

### 3) Start development server

```bash
pnpm dev
```

This runs `tsx server.ts`, so both Next and Socket.IO are served together.

Open:

- `http://localhost:3000`

### 4) Production-style local run

```bash
pnpm build
pnpm start
```

## How to play locally (quick flow)

1. Open the app in browser A, enter a name, click **Create Room**.
2. Copy the room code.
3. Open browser B (or private window), enter a name and room code, click **Join Room**.
4. As host, adjust settings in lobby and click **Start Game**.
5. Play cards, draw/pass, call UNO, or catch UNO on opponents.
6. At game over, use **Rematch** or **Leave**.

## Deploying on Vercel (correct guide for this project)

### Important reality check

This project uses a **custom Node server** (`server.ts`) with a long-lived Socket.IO server.  
That architecture does **not** run natively on Vercel’s default serverless model.

### Correct production approach with Vercel

Use a split deployment:

- Deploy **Next.js web app** on Vercel
- Deploy **Socket.IO + game server** on a Node host that supports persistent connections (Railway/Render/Fly.io/VM)

### Required code adjustment before split deployment

The client currently connects with `io()` (same-origin).  
For split deployment, change socket client initialization to use an environment variable URL, e.g.:

- `NEXT_PUBLIC_SOCKET_URL=https://your-realtime-server.example.com`

Then connect with `io(process.env.NEXT_PUBLIC_SOCKET_URL, { autoConnect: false })`.

### Vercel steps (frontend)

1. Push this repo to GitHub.
2. In Vercel: **Add New Project** -> import repo.
3. Framework preset: **Next.js**.
4. Install command: `pnpm install`
5. Build command: `pnpm build`
6. Output: default Next.js output
7. Add env var:
   - `NEXT_PUBLIC_SOCKET_URL` = your realtime server URL
8. Deploy.

### Realtime server steps (backend)

1. Deploy a Node process that runs `server.ts` (or a server-only extraction of socket/game logic).
2. Ensure WebSocket upgrades are supported.
3. Configure CORS to allow your Vercel domain.
4. Expose HTTPS endpoint.

### If you want “Vercel only”

You would need to refactor realtime away from a custom long-lived Socket.IO server (for example to a managed realtime service). Without that refactor, Vercel-only deployment is not reliable for this architecture.

## Scripts

- `pnpm dev` - run custom dev server (`tsx server.ts`)
- `pnpm build` - Next.js production build
- `pnpm start` - run custom production server (`tsx server.ts`)
- `pnpm lint` - run ESLint
