// ── Card Types ──────────────────────────────────────────────────────────────

export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';

export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild_draw4';

export interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
  isWild: boolean;
}

// ── Player Types ────────────────────────────────────────────────────────────

export type PlayerType = 'human' | 'bot';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  difficulty?: BotDifficulty;
  hand: UnoCard[];
  saidUno: boolean;
  isConnected: boolean;
}

// ── Game Types ──────────────────────────────────────────────────────────────

export type GamePhase =
  | 'waiting'
  | 'starting'
  | 'playing'
  | 'color_pick'
  | 'finished';

export interface GameSettings {
  maxPlayers: number;
  turnTimerSeconds: number | null;
  botDifficulty: BotDifficulty;
  variants: {
    stacking: boolean;
    jumpIn: boolean;
    sevenZero: boolean;
  };
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  deck: UnoCard[];
  discardPile: UnoCard[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  currentColor: CardColor;
  pendingDrawCount: number;
  turnStartTime: number | null;
  settings: GameSettings;
  winner: string | null;
  lastAction: string;
  hostId: string;
  cumulativeScores: Record<string, number>;
  roundNumber: number;
}

export interface RoomSummary {
  code: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhase;
  hostId: string;
}

// ── Client-Facing Types (private data stripped) ─────────────────────────────

export interface ClientPlayer extends Omit<Player, 'hand'> {
  handSize: number;
}

export interface ClientGameState extends Omit<GameState, 'players' | 'deck'> {
  players: ClientPlayer[];
  deckSize: number;
  myHand: UnoCard[];
  cumulativeScores: Record<string, number>;
  roundNumber: number;
}

// ── Socket Event Maps ───────────────────────────────────────────────────────

export interface ClientToServerEvents {
  CREATE_ROOM: (data: { playerName: string; settings?: Partial<GameSettings> }) => void;
  JOIN_ROOM: (data: { roomCode: string; playerName: string }) => void;
  UPDATE_SETTINGS: (data: { settings: Partial<GameSettings> }) => void;
  START_GAME: () => void;
  PLAY_CARD: (data: { cardId: string; chosenColor?: CardColor }) => void;
  DRAW_CARD: () => void;
  PASS_TURN: () => void;
  SAY_UNO: () => void;
  CHALLENGE_UNO: (data: { targetPlayerId: string }) => void;
  CHALLENGE_WILD4: () => void;
  CHOOSE_COLOR: (data: { color: CardColor }) => void;
  CHOOSE_SWAP_TARGET: (data: { targetPlayerId: string }) => void;
  JUMP_IN: (data: { cardId: string }) => void;
  LEAVE_ROOM: () => void;
  REQUEST_REMATCH: () => void;
  FORCE_STOP: () => void;
  FORCE_STOP_VOTE: (data: { vote: boolean }) => void;
  RECONNECT: (data: { sessionId: string; roomCode: string }) => void;
  SEND_MESSAGE: (data: { message: string }) => void;
}

export interface ServerToClientEvents {
  ROOM_CREATED: (data: { roomCode: string; playerId: string }) => void;
  ROOM_JOINED: (data: { roomCode: string; playerId: string }) => void;
  ROOM_ERROR: (data: { message: string }) => void;
  LOBBY_UPDATE: (data: { players: ClientPlayer[]; settings: GameSettings; hostId: string }) => void;
  GAME_STARTED: (data: { state: ClientGameState }) => void;
  GAME_STATE_UPDATE: (data: { state: ClientGameState }) => void;
  YOUR_TURN: (data: { timeLimit?: number }) => void;
  JUMP_IN_WINDOW: (data: { card: UnoCard; duration: number }) => void;
  CHOOSE_COLOR_PROMPT: () => void;
  CHOOSE_SWAP_PROMPT: (data: { players: ClientPlayer[] }) => void;
  UNO_CALLED: (data: { playerId: string }) => void;
  UNO_PENALTY: (data: { playerId: string }) => void;
  WILD4_CHALLENGED: (data: { result: 'success' | 'fail'; drawCount: number }) => void;
  GAME_OVER: (data: { winnerId: string; scores: Record<string, number> }) => void;
  PLAYER_DISCONNECTED: (data: { playerId: string }) => void;
  REMATCH_VOTE: (data: { votes: number; required: number }) => void;
  REMATCH_STARTED: (data: { state: ClientGameState }) => void;
  TIMER_TICK: (data: { remaining: number }) => void;
  TIMER_EXPIRED: (data: { playerId: string }) => void;
  FORCE_STOPPED: () => void;
  FORCE_STOP_VOTE_STARTED: (data: { initiator: string; endsAt: number }) => void;
  FORCE_STOP_VOTE_UPDATE: (data: { yes: number; no: number; total: number; endsAt: number }) => void;
  FORCE_STOP_VOTE_RESULT: (data: { passed: boolean }) => void;
  RECONNECTED: (data: { roomCode: string; playerId: string; state: ClientGameState }) => void;
  CHAT_MESSAGE: (data: { playerId: string; playerName: string; message: string; timestamp: number }) => void;
}

export type InterServerEvents = Record<string, never>;

export interface SocketData {
  roomCode: string;
  playerName: string;
}
