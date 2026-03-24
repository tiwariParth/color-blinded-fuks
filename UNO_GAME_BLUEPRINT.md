# 🎴 UNO Online — Full Game Blueprint

> **Stack:** Next.js 14+ (App Router) · TypeScript · Socket.IO · Three.js · Framer Motion · No auth — rooms only

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Folder Structure](#3-folder-structure)
4. [Core Data Models](#4-core-data-models)
5. [Card System & Deck](#5-card-system--deck)
6. [Game Rules Engine](#6-game-rules-engine)
7. [Variant Rules](#7-variant-rules)
8. [Bot AI System](#8-bot-ai-system)
9. [Room System](#9-room-system)
10. [WebSocket Event Map](#10-websocket-event-map)
11. [API Routes](#11-api-routes)
12. [Frontend Pages & Components](#12-frontend-pages--components)
13. [Card Visual Design](#13-card-visual-design)
14. [Game Flow State Machine](#14-game-flow-state-machine)
15. [Turn Timer System](#15-turn-timer-system)
16. [Win Condition & Scoring](#16-win-condition--scoring)
17. [Implementation Phases](#17-implementation-phases)
18. [Key Edge Cases](#18-key-edge-cases)

---

## 1. Project Overview

A real-time, browser-based UNO game for 2–10 players. No accounts, no login — players create or join rooms via a 6-character alphanumeric code. The host configures the game settings. When human players are fewer than the selected player count, the remaining slots are filled with bots.

**Core features:**
- Realistic UNO card visuals rendered in SVG/CSS
- 3D card flip, deal, and play animations via Three.js (`@react-three/fiber` + `@react-three/drei`)
- Fluid UI transitions, stagger reveals, and micro-interactions via Framer Motion
- Real-time multiplayer via WebSockets (Socket.IO)
- Bot players with Easy / Medium / Hard difficulty
- Variant rules: Stacking, Jump-In, Seven-0
- Host-configurable turn timer
- Mobile-responsive UI

---

## 2. Tech Stack & Architecture

### Frontend
| Concern | Tool |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Modules for card art |
| Real-time | Socket.IO client |
| State | Zustand |
| UI Animation | Framer Motion |
| 3D Rendering | Three.js via `@react-three/fiber` + `@react-three/drei` |

### Backend
| Concern | Tool |
|---|---|
| Server | Next.js custom server (`server.ts`) |
| Real-time | Socket.IO server (attached to Next.js HTTP server) |
| Game Logic | Pure TypeScript modules (no DB needed) |
| State Storage | In-memory Map (rooms live only while server runs) |
| Bot Loop | `setInterval` / async timeouts per room |

### Why no database?
Rooms are ephemeral. A game lasts minutes to hours, and there's no user identity to persist. All state lives in-memory on the server, synced to clients via WebSocket.

---

## 3. Folder Structure

```
/
├── server.ts                   # Custom Next.js + Socket.IO server entry
├── next.config.ts
├── tsconfig.json
│
├── src/
│   ├── app/
│   │   ├── page.tsx            # Landing — Create or Join room
│   │   ├── room/
│   │   │   └── [code]/
│   │   │       └── page.tsx    # Game room (lobby + game)
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── cards/
│   │   │   ├── UnoCard.tsx     # Single card renderer (SVG-based)
│   │   │   ├── CardBack.tsx    # Face-down card
│   │   │   └── CardHand.tsx    # Player's hand (fan layout)
│   │   ├── game/
│   │   │   ├── GameBoard.tsx   # Main play area
│   │   │   ├── DiscardPile.tsx
│   │   │   ├── DrawPile.tsx
│   │   │   ├── PlayerSeat.tsx  # Other players' hands (face down)
│   │   │   ├── TurnTimer.tsx
│   │   │   ├── ColorPicker.tsx # Wild card color chooser
│   │   │   ├── UnoButton.tsx   # "UNO!" shout button
│   │   │   └── GameLog.tsx     # Action feed
│   │   ├── lobby/
│   │   │   ├── LobbyRoom.tsx
│   │   │   ├── PlayerSlot.tsx
│   │   │   └── SettingsPanel.tsx
│   │   └── ui/
│   │       ├── RoomCodeDisplay.tsx
│   │       └── Toast.tsx
│   │
│   ├── lib/
│   │   ├── game/
│   │   │   ├── deck.ts         # Deck creation, shuffle
│   │   │   ├── rules.ts        # Core rules engine
│   │   │   ├── variants.ts     # Stacking, Jump-In, Seven-0
│   │   │   ├── bots.ts         # Bot decision engine
│   │   │   └── roomManager.ts  # In-memory room state manager
│   │   ├── socket/
│   │   │   ├── server.ts       # Socket.IO server event handlers
│   │   │   └── client.ts       # Socket.IO client singleton
│   │   └── types.ts            # All shared TypeScript types
│   │
│   └── hooks/
│       ├── useSocket.ts
│       ├── useGameState.ts
│       └── useTimer.ts
```

---

## 4. Core Data Models

```typescript
// src/lib/types.ts

export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild_draw4';

export interface UnoCard {
  id: string;           // unique e.g. "red_7_a"
  color: CardColor;
  value: CardValue;
  isWild: boolean;
}

export type PlayerType = 'human' | 'bot';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;                     // socket ID for humans, uuid for bots
  name: string;
  type: PlayerType;
  difficulty?: BotDifficulty;     // bots only
  hand: UnoCard[];
  saidUno: boolean;               // has pressed UNO button with 1 card left
  isConnected: boolean;
}

export type GamePhase =
  | 'waiting'       // in lobby
  | 'starting'      // countdown
  | 'playing'       // active game
  | 'color_pick'    // current player must pick color after wild
  | 'finished';     // someone won

export interface GameSettings {
  maxPlayers: number;       // 2–10
  turnTimerSeconds: number | null;  // null = no timer
  botDifficulty: BotDifficulty;     // default for all bots
  variants: {
    stacking: boolean;      // +2 on +2, +4 on +4
    jumpIn: boolean;        // play exact same card out of turn
    sevenZero: boolean;     // 7 = swap with chosen player, 0 = rotate all hands
  };
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  deck: UnoCard[];          // draw pile
  discardPile: UnoCard[];   // top is active card
  currentPlayerIndex: number;
  direction: 1 | -1;        // 1 = clockwise, -1 = counter-clockwise
  currentColor: CardColor;  // active color (needed for wild)
  pendingDrawCount: number; // stacking: accumulated +2/+4 cards
  turnStartTime: number | null;   // timestamp for timer
  settings: GameSettings;
  winner: string | null;    // player id
  lastAction: string;       // human-readable log of last action
}

export interface RoomSummary {
  code: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhase;
  hostId: string;
}

// What each client receives (hand is private — only their own cards)
export interface ClientGameState extends Omit<GameState, 'players' | 'deck'> {
  players: ClientPlayer[];
  deckSize: number;   // count only, not actual cards
  myHand: UnoCard[];  // only the current socket's cards
}

export interface ClientPlayer extends Omit<Player, 'hand'> {
  handSize: number;   // other players only see count
}
```

---

## 5. Card System & Deck

### Standard UNO Deck (108 cards)

| Type | Details | Count |
|---|---|---|
| Number cards | 0 (×1 per color) + 1–9 (×2 per color) × 4 colors | 76 |
| Skip | 2 per color × 4 colors | 8 |
| Reverse | 2 per color × 4 colors | 8 |
| Draw Two (+2) | 2 per color × 4 colors | 8 |
| Wild | 4 total | 4 |
| Wild Draw Four (+4) | 4 total | 4 |
| **Total** | | **108** |

### deck.ts responsibilities
- `createDeck(): UnoCard[]` — build the 108-card deck with unique IDs
- `shuffle(deck: UnoCard[]): UnoCard[]` — Fisher-Yates shuffle
- `dealHands(deck, playerCount): { hands, remaining }` — deal 7 cards each
- `getStartCard(deck): { card, remaining }` — draw first discard (re-draw if Wild +4)

---

## 6. Game Rules Engine

### `rules.ts` — Core Functions

#### `canPlayCard(card, topDiscard, currentColor, pendingDrawCount, variants)`
Returns `boolean`. A card is playable if:
- Color matches `currentColor`, OR
- Value/type matches top discard card's value, OR
- Card is a Wild or Wild+4, OR
- Stacking variant is on AND a draw card is pending AND card is a matching draw card

#### `isValidFirstCard(card): boolean`
The first card flipped from deck must not be Wild +4. If it is, shuffle it back and draw again.

#### `applyCardEffect(state, card, chosenColor?): GameState`
Mutates and returns new game state after a card is played:

| Card | Effect |
|---|---|
| Number | Advance turn |
| Skip | Skip next player's turn |
| Reverse | Flip direction; in 2-player acts like Skip |
| Draw Two | Next player draws 2 (or stacks if variant on) |
| Wild | Current player picks color; advance turn |
| Wild Draw Four | Next player draws 4 (or stacks); current player picks color |

#### `nextPlayerIndex(state): number`
Calculates the next player's index based on direction, wrapping around.

#### `checkUnoViolation(state, playerIndex): boolean`
Returns `true` if a player has exactly 1 card, hasn't said UNO, and can be challenged.

#### `drawCards(state, playerIndex, count): GameState`
Draws `count` cards for player. If deck runs out, reshuffles discard pile (keeping top card) into new deck.

---

## 7. Variant Rules

### Stacking (`variants.stacking`)
- When a +2 is played, next player can stack another +2 instead of drawing
- When a +4 is played, next player can stack another +4
- +2 cannot be stacked on +4 and vice versa
- Stack accumulates until a player cannot or chooses not to stack — that player draws the total
- `pendingDrawCount` in state tracks the accumulated amount

### Jump-In (`variants.jumpIn`)
- Any player (even out of turn) can play the **exact same card** (same color AND value) as the top discard
- Play continues clockwise from the jump-in player
- Bots can jump in within a 500ms reaction window before turn passes
- Socket event: `JUMP_IN` — validated server-side

### Seven-0 (`variants.sevenZero`)
- Playing a **7**: current player chooses any other player to swap hands with
- Playing a **0**: all players pass their hands in the current direction of play
- UI prompt appears when a 7 is played (similar to color picker)

---

## 8. Bot AI System

### Bot turn trigger
After the current player's turn ends and it's a bot's turn, the server waits a human-like delay before acting:
- Easy: 1500–2500ms
- Medium: 800–1500ms  
- Hard: 400–800ms

### Easy Bot
- Picks a **random** valid playable card
- Never strategically uses action cards
- Randomly forgets to press UNO (70% chance of calling it)

### Medium Bot
- Prefers to play action cards (Skip, Reverse, Draw) over number cards
- Prefers to save Wilds for when no other card is playable
- Will call UNO reliably (95% of the time)
- When choosing Wild color: picks the color it has the most of

### Hard Bot
- Full strategic play:
  - Plays action cards on players with fewest cards (most threatening)
  - Uses Wild +4 only when legally allowed and strategically best
  - Tracks discard pile to infer what colors opponents want
  - When playing 7 (swap): always swaps with the player who has fewest cards
  - Always calls UNO
  - Will attempt Jump-In if variant is on and it holds the same card

### `bots.ts` exports
```typescript
chooseBotCard(state: GameState, botPlayer: Player): UnoCard | null
chooseBotColor(bot: Player): CardColor
chooseBotSwapTarget(state: GameState, bot: Player): string // player id, for Seven
triggerBotTurn(roomCode: string): void   // called by roomManager after delay
```

---

## 9. Room System

### Room Lifecycle
```
CREATE ROOM → LOBBY (waiting) → GAME START → PLAYING → GAME OVER → (rematch?) → LOBBY
```

### Room Creation
- Host picks a display name
- Server generates a 6-char alphanumeric room code (e.g. `X7K2PQ`)
- Host is added as first player
- Default settings applied (can be changed in lobby)

### Joining a Room
- Player enters code + display name
- Server validates: room exists, not full, game not in progress
- Player added to room's player list
- All lobby members notified

### Host Privileges (lobby only)
- Change max players (2–10)
- Set turn timer (off / 15s / 30s / 60s / custom)
- Set default bot difficulty
- Toggle variant rules
- Kick players
- Start the game (minimum 2 players required)

### Bot Slot Filling
When the host starts the game:
- If `players.length < settings.maxPlayers`, fill remaining slots with bots
- Bots are named "Bot 1", "Bot 2", etc.
- Bot difficulty comes from `settings.botDifficulty`
- **Exception:** if only 1 human and host selected 2 players → 1 bot. If host selected 3 players → 2 bots. Etc.

### Disconnection Handling
- If a human disconnects mid-game, their slot becomes a bot (same difficulty as room default)
- If the host disconnects in lobby, the next human player becomes host
- If all humans disconnect, the room is destroyed after 60 seconds

---

## 10. WebSocket Event Map

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `CREATE_ROOM` | `{ playerName, settings }` | Create new room |
| `JOIN_ROOM` | `{ roomCode, playerName }` | Join existing room |
| `UPDATE_SETTINGS` | `{ settings }` | Host updates settings |
| `START_GAME` | `{}` | Host starts game |
| `PLAY_CARD` | `{ cardId, chosenColor? }` | Play a card from hand |
| `DRAW_CARD` | `{}` | Draw from deck (no playable card) |
| `PASS_TURN` | `{}` | Pass after drawing (if drawn card not playable) |
| `SAY_UNO` | `{}` | Press UNO button |
| `CHALLENGE_UNO` | `{ targetPlayerId }` | Challenge player who forgot UNO |
| `CHALLENGE_WILD4` | `{}` | Challenge the Wild +4 play |
| `CHOOSE_COLOR` | `{ color }` | After playing Wild card |
| `CHOOSE_SWAP_TARGET` | `{ targetPlayerId }` | After playing 7 (Seven-0 variant) |
| `JUMP_IN` | `{ cardId }` | Jump-in with exact matching card |
| `LEAVE_ROOM` | `{}` | Leave room |
| `REQUEST_REMATCH` | `{}` | Vote for rematch after game over |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `ROOM_CREATED` | `{ roomCode, playerId }` | Confirmation after create |
| `ROOM_JOINED` | `{ roomCode, playerId }` | Confirmation after join |
| `ROOM_ERROR` | `{ message }` | Join/create error |
| `LOBBY_UPDATE` | `{ players, settings, hostId }` | Lobby state changed |
| `GAME_STARTED` | `{ state: ClientGameState }` | Game begins |
| `GAME_STATE_UPDATE` | `{ state: ClientGameState }` | Any state change |
| `YOUR_TURN` | `{ timeLimit? }` | Notify whose turn |
| `JUMP_IN_WINDOW` | `{ card, duration }` | Broadcast jump-in opportunity |
| `CHOOSE_COLOR_PROMPT` | `{}` | You played a wild, pick color |
| `CHOOSE_SWAP_PROMPT` | `{ players }` | You played a 7, pick swap target |
| `UNO_CALLED` | `{ playerId }` | Someone said UNO |
| `UNO_PENALTY` | `{ playerId }` | Someone got caught |
| `WILD4_CHALLENGED` | `{ result, drawCount }` | Challenge result |
| `GAME_OVER` | `{ winnerId, scores }` | Game ended |
| `PLAYER_DISCONNECTED` | `{ playerId }` | Someone left |
| `REMATCH_VOTE` | `{ votes, required }` | Rematch vote update |
| `REMATCH_STARTED` | `{ state }` | Rematch begins |
| `TIMER_TICK` | `{ remaining }` | Timer countdown |
| `TIMER_EXPIRED` | `{ playerId }` | Player ran out of time |

---

## 11. API Routes

These are minimal — most logic is WebSocket. REST endpoints only for initial handshake.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/room/[code]` | Check if room exists & its status |
| `GET` | `/api/health` | Server health check |

---

## 12. Frontend Pages & Components

### Pages

#### `/` — Landing Page
- Two actions: **Create Room** and **Join Room**
- Create: enter display name → create → land in lobby as host
- Join: enter name + room code → validate → land in lobby

#### `/room/[code]` — Room Page
- Renders `<LobbyRoom>` when `phase === 'waiting'`
- Renders `<GameBoard>` when `phase === 'playing'`
- Renders `<GameOver>` when `phase === 'finished'`

### Key Components

#### `<UnoCard>`
SVG-rendered card with:
- Colored background (red/yellow/green/blue/black for wild)
- Oval center decoration
- Value text / icon (number, symbol, or wild design)
- Realistic rounded corners, subtle shadow, glossy sheen effect
- Flip animation on draw
- Hover lift effect on playable cards
- Greyed-out state for unplayable cards in hand

#### `<CardHand>`
- Fan layout for the player's own hand
- Cards spread in an arc
- Hovering a card lifts and highlights it
- Clicking a playable card plays it (or prompts color pick)
- Cards slide in when drawn, slide out when played

#### `<GameBoard>` layout
```
┌──────────────────────────────────────────┐
│  [Player 3]    [Player 4]    [Player 5]  │  ← top opponents
│                                          │
│ [Player 2]   [Deck] [Discard] [Player 6] │  ← side opponents + center piles
│                                          │
│  [Player 1]                  [Player 7]  │  ← side opponents
│                                          │
│        ← Your Hand (fan arc) →           │  ← bottom = you
│            [UNO Button]                  │
└──────────────────────────────────────────┘
```

#### `<PlayerSeat>`
Shows other players:
- Display name
- Card count (face-down card stack)
- "UNO!" badge when they have 1 card
- Glow ring when it's their turn
- Bot indicator icon

#### `<ColorPicker>`
- Modal overlay after playing Wild
- 4 color swatches (red, yellow, green, blue)
- Animated entrance

#### `<TurnTimer>`
- Circular progress ring
- Counts down from set seconds
- Pulses red in final 5 seconds
- Auto-draws for player on expiry

#### `<UnoButton>`
- Prominent button that lights up when you have 2 cards (pre-emptive) or 1 card
- Clicking when you have 1 card = safe; clicking when you have ≥2 = no effect
- Other players can click a "Catch!" button on any player with 1 card who hasn't called UNO within a 2-second window

---

## 13. Card Visual Design

All cards should be rendered as SVG or CSS, **not images**, for scalability.

### Card Anatomy
```
┌─────────────────┐
│ [V]             │  ← top-left: small value
│                 │
│   ╔═════════╗   │
│   ║  [oval] ║   │  ← center oval with value/icon
│   ║  [val]  ║   │
│   ╚═════════╝   │
│                 │
│             [V] │  ← bottom-right: inverted small value
└─────────────────┘
```

### Color Palette (faithful to real UNO)
| Color | Background | Oval |
|---|---|---|
| Red | `#E03A2A` | `#C0281A` |
| Yellow | `#F5C800` | `#D4A800` |
| Green | `#3DAA4F` | `#2A8A38` |
| Blue | `#2A6DB5` | `#1A5295` |
| Wild | `#1A1A1A` | multicolor pie |

### Card Back
- Deep navy/black background
- "UNO" logo centered in bold oval
- Geometric border pattern

### Action Card Icons (SVG paths)
- Skip: circle with diagonal line
- Reverse: two curved arrows
- Draw Two: two overlapping cards with "+2"
- Wild: four-color pinwheel
- Wild Draw Four: four-color pinwheel + "+4"

---

## 14. Game Flow State Machine

```
[WAITING / LOBBY]
     │
     │ host clicks START
     ▼
[STARTING] — 3-second countdown
     │
     ▼
[PLAYING] ◄────────────────────────────┐
     │                                  │
     ├─ player plays number card ───────┤ (advance turn)
     │                                  │
     ├─ player plays Skip ──────────────┤ (skip next, advance)
     │                                  │
     ├─ player plays Reverse ───────────┤ (flip direction, advance)
     │                                  │
     ├─ player plays +2 ────────────────┤ (next draws or stacks)
     │                                  │
     ├─ player plays Wild ──► [COLOR_PICK] ─► advance turn ──┤
     │                                  │
     ├─ player plays Wild+4 ──► [COLOR_PICK] ─► next draws or stacks ─┤
     │                                  │
     ├─ player plays 7 ──► [SWAP_PICK] ─► swap hands ─► advance ──┤
     │                                  │
     ├─ player plays 0 ─────────────────┤ (rotate hands, advance)
     │                                  │
     ├─ player draws card ──────────────┤ (can play drawn or pass)
     │                                  │
     └─ player has 0 cards ─────────────┼──► [FINISHED]
                                         │
                                    (rematch?) ──► [WAITING]
```

---

## 15. Turn Timer System

### Configuration options (set by host)
- Off (no timer)
- 15 seconds
- 30 seconds
- 60 seconds

### Behavior
- Timer starts when `YOUR_TURN` event is sent to current player
- Server is authoritative on timer (don't trust client-side timer)
- Server emits `TIMER_TICK` every second
- On expiry: server auto-draws 1 card for the player, then auto-passes turn
- If drawn card is playable, it is NOT auto-played — just drawn, turn skips
- Bots are not affected by the timer (they act on their own schedule)

---

## 16. Win Condition & Scoring

### Win Condition
A player wins immediately when they play their last card. If they play their second-to-last card, they must press **UNO** before the next player takes an action — or they get penalized 2 cards.

### UNO Penalty
- Player forgets to call UNO (has 1 card, hasn't pressed button)
- Any other player can tap **"Catch!"** within a 2-second window after the play
- First person to tap Catch wins the challenge
- Penalized player draws 2 cards

### Wild +4 Challenge
- Next player (the one who must draw) can challenge a Wild +4
- If challenger wins (the player who played it HAD other playable cards): player who played it draws 4
- If challenger loses: challenger draws 6 (4 + 2 penalty)

### Scoring (optional round tracking)
When someone wins a round, other players' remaining cards count against them:

| Card | Points |
|---|---|
| Number cards | Face value (0–9) |
| Skip, Reverse, Draw Two | 20 points |
| Wild, Wild Draw Four | 50 points |

First player to reach **500 points loses** (or track who has lowest after N rounds).

For simplicity in V1: just track wins per player across rematches.

---

## 17. Three.js & Framer Motion — Animation System

### Philosophy
- **Three.js** owns anything that is physically 3D: cards flying through space, the deck pile, the discard pile, card dealing arcs
- **Framer Motion** owns everything 2D UI: page transitions, lobby reveals, color picker, toast notifications, UNO button, player seats fading in/out, turn indicators
- The two live side by side — the Three.js `<Canvas>` fills the game board background/center, while Framer Motion components layer on top as HTML/CSS overlays

---

### Three.js Usage (`@react-three/fiber` + `@react-three/drei`)

#### Package installs
```bash
npm install three @react-three/fiber @react-three/drei
npm install --save-dev @types/three
```

#### `<GameCanvas>` — the R3F scene
A full-screen `<Canvas>` that sits behind the 2D UI layer. Contains:
- The 3D draw pile (stacked card meshes)
- The 3D discard pile
- Flying card animations between positions
- Ambient particle/light effects

```tsx
// components/three/GameCanvas.tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'

export function GameCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 5, 8], fov: 50 }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Environment preset="city" />
      <DrawPile3D />
      <DiscardPile3D />
      <FlyingCard />   {/* animated card that flies when played */}
    </Canvas>
  )
}
```

#### `<Card3D>` — a single 3D card mesh
```tsx
// Geometry: BoxGeometry(1.4, 2, 0.02) — thin card proportions
// Front face: CanvasTexture generated from the SVG card design
// Back face: CardBack texture
// Materials: MeshStandardMaterial with slight roughness for matte finish
// On hover: scale up slightly (useSpring from @react-spring/three)
```

#### Card deal animation
When the game starts:
- All cards begin stacked at the deck position (center-ish)
- Each card flies in an arc to its player's seat position
- Uses `useFrame` + custom easing (ease-out cubic)
- Delay staggered per card: `delay = cardIndex * 80ms`
- Cards rotate face-down mid-flight, face-up when they land in your hand

#### Card play animation
When a player plays a card:
- The card detaches from the hand (HTML → 3D handoff via position calculation)
- Flies in a smooth arc to the discard pile center
- Slight spin on Z-axis as it travels
- Lands with a satisfying "thud" scale bounce

```typescript
// Animation spring config
const playCardSpring = {
  tension: 200,
  friction: 20,
  duration: 400, // ms
}
```

#### Card draw animation
- Card pops off the top of the 3D deck pile
- Flies to the current player's hand position
- Brief flip: face-down → face-up on arrival (for the drawing player only)

#### Discard pile
- Top 3–4 cards visible, fanned slightly
- New card lands with rotation randomized ±15° for natural pile look
- Pile subtly scales up when a Wild +4 or action card lands

#### Wild color picker — 3D version
- Four colored orbs float in a diamond pattern above the discard pile
- Player clicks one to choose color
- Unchosen orbs implode; chosen orb explodes into particles matching the color
- Implemented with `<mesh>` + `<pointsMaterial>` for particles

#### Table / environment
- The game board is a felt-green (or dark moody) table plane: `<PlaneGeometry args={[20, 14]} />`
- Subtle point lights cast soft shadows on the table
- Optional: slow rotating `<Environment>` for ambient reflections on card surfaces

---

### Framer Motion Usage

#### Package install
```bash
npm install framer-motion
```

#### Page transitions
```tsx
// app/room/[code]/page.tsx
<AnimatePresence mode="wait">
  {phase === 'waiting' && (
    <motion.div
      key="lobby"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <LobbyRoom />
    </motion.div>
  )}
  {phase === 'playing' && (
    <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <GameBoard />
    </motion.div>
  )}
</AnimatePresence>
```

#### Player seats — stagger in on lobby join
```tsx
// Each PlayerSlot staggers in as players join the lobby
<motion.div
  variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1 } }}
  initial="hidden"
  animate="show"
  transition={{ delay: index * 0.1 }}
>
  <PlayerSlot player={player} />
</motion.div>
```

#### Turn indicator glow
```tsx
// Pulse ring around active player seat
<motion.div
  animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
  className="absolute inset-0 rounded-full border-2 border-yellow-400"
/>
```

#### UNO Button
```tsx
// Explodes when clicked — scale punch + color flash
<motion.button
  whileTap={{ scale: 0.88 }}
  animate={saidUno ? { scale: [1, 1.3, 1], backgroundColor: ['#e03a2a', '#ff6b35', '#e03a2a'] } : {}}
  transition={{ duration: 0.3 }}
>
  UNO!
</motion.button>
```

#### Color Picker modal
```tsx
// Four swatches scale in with spring stagger
const swatchVariants = {
  hidden: { scale: 0, opacity: 0 },
  show: (i: number) => ({
    scale: 1, opacity: 1,
    transition: { delay: i * 0.07, type: 'spring', stiffness: 400, damping: 20 }
  })
}
```

#### Card hand (2D overlay)
Although cards travel in 3D, the player's own hand cards are rendered as 2D HTML elements with Framer Motion for responsiveness and accessibility:
```tsx
// Each card in hand:
<motion.div
  layout                              // auto-animates when hand changes
  initial={{ y: 60, opacity: 0 }}    // deal: slides up from bottom
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: -200, opacity: 0 }}     // play: shoots upward
  whileHover={{ y: -16, scale: 1.08 }}
  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
>
  <UnoCard card={card} />
</motion.div>
```

#### Toast / game log notifications
```tsx
// "Player 2 drew 4 cards!" toasts slide in from right
<AnimatePresence>
  {toasts.map(toast => (
    <motion.div
      key={toast.id}
      initial={{ x: 80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
    >
      {toast.message}
    </motion.div>
  ))}
</AnimatePresence>
```

#### Game Over screen
```tsx
// Winner card bursts in with confetti (CSS-based particles)
// Other players' scores stagger in below
<motion.div
  initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
  animate={{ scale: 1, rotate: 0, opacity: 1 }}
  transition={{ type: 'spring', stiffness: 250, damping: 18 }}
>
  🏆 {winnerName} wins!
</motion.div>
```

#### Timer ring
```tsx
// SVG circle stroke-dashoffset animated via Framer Motion
<motion.circle
  strokeDasharray={circumference}
  animate={{ strokeDashoffset: circumference * (1 - timeLeft / totalTime) }}
  transition={{ duration: 1, ease: 'linear' }}
  // Turns red in final 5 seconds:
  style={{ stroke: timeLeft <= 5 ? '#e03a2a' : '#4ade80' }}
/>
```

---

### Layering Architecture (HTML + Three.js)

```
z-index: 0   → <GameCanvas> (Three.js / R3F) — table, piles, flying cards
z-index: 10  → <GameBoard> (HTML/Framer Motion) — opponent seats, hand, HUD
z-index: 20  → <ColorPicker>, <SwapPicker> modals
z-index: 30  → <Toast> notifications, <UnoButton>
z-index: 40  → <TurnTimer> overlay
```

The key technique: when a card is "played" from the HTML hand, calculate the card's bounding rect, pass those world coordinates to the Three.js scene, hide the HTML card, and trigger the 3D fly animation. On arrival at discard pile, the 3D card settles and the HTML discard pile top-card updates.

---

## 18. Implementation Phases

### Phase 1 — Foundation
- [ ] Custom Next.js server with Socket.IO attached
- [ ] Room creation & joining (in-memory)
- [ ] Lobby UI with settings panel (Framer Motion stagger reveals)
- [ ] Deck creation, shuffle, deal

### Phase 2 — Core Gameplay
- [ ] Basic card play (number cards, colors)
- [ ] Turn management, direction
- [ ] Draw pile + discard pile
- [ ] Action cards: Skip, Reverse, Draw Two
- [ ] Wild + color picker (Framer Motion spring swatches)
- [ ] Win detection

### Phase 3 — Action Cards & Wilds
- [ ] Wild Draw Four + challenge mechanic
- [ ] UNO button + penalty system (Framer Motion punch animation)
- [ ] Deck reshuffling when draw pile empties

### Phase 4 — Bots
- [ ] Easy bot
- [ ] Medium bot
- [ ] Hard bot
- [ ] Bot delay simulation

### Phase 5 — Variant Rules
- [ ] Stacking (+2/+4)
- [ ] Jump-In
- [ ] Seven-0

### Phase 6 — Turn Timer
- [ ] Server-side timer
- [ ] Framer Motion SVG timer ring component
- [ ] Auto-draw on expiry

### Phase 7 — Three.js Scene
- [ ] `<GameCanvas>` R3F setup, table mesh, lighting
- [ ] `<Card3D>` mesh with SVG texture baking
- [ ] Deal animation (cards arc to player seats)
- [ ] Card play fly animation (hand → discard pile)
- [ ] Card draw animation (deck → hand)
- [ ] Wild color picker 3D orbs + particle explosion
- [ ] HTML ↔ Three.js coordinate handoff system

### Phase 8 — Framer Motion Polish
- [ ] Page/phase transitions (`AnimatePresence`)
- [ ] Player seat stagger on lobby join
- [ ] `layout` prop on hand cards (auto-reflow when hand changes)
- [ ] Turn indicator pulse ring
- [ ] Toast notification slide-ins
- [ ] Game Over winner burst + score stagger

### Phase 9 — Final Polish
- [ ] Sound effects (optional: Howler.js)
- [ ] Game log feed
- [ ] Rematch system
- [ ] Mobile responsive layout
- [ ] Disconnection → bot replacement
- [ ] Performance audit (R3F `frameloop="demand"` to avoid constant re-render)

---

## 18. Key Edge Cases

| Scenario | Handling |
|---|---|
| Draw pile empty | Shuffle discard (minus top card) to form new deck |
| Wild +4 played illegally | Challenger wins; player who played it draws 4 |
| Only 2 players + Reverse card | Acts as a Skip |
| Player disconnects on their turn | Bot takes over immediately |
| Last card is a Wild | Player still wins — color pick is skipped |
| Last card is a Draw Two / Wild+4 | Next player draws, but game is over — drawer doesn't draw in some rulesets. Standard ruling: **winner wins immediately** |
| Stacking results in 0 playable cards | Player must draw the accumulated total |
| Seven played with 2 players | Only one swap target — automatic |
| Zero played with 2 players | Hands swap (same as 7 with 2 players) |
| Jump-in causes skip | Player after jump-in player is next |
| All bots in a room | Valid — host can watch bots play |
| Room code collision | Regenerate until unique |
| Timer expires on color pick | Auto-pick the color the player has most of (or random) |
