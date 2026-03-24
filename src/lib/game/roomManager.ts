import type { GameState, GameSettings, Player, ClientPlayer, CardColor } from '@/lib/types';
import { createDeck, shuffle, dealHands, getStartCard } from '@/lib/game/deck';

const rooms = new Map<string, GameState>();
const socketToRoom = new Map<string, string>();
// sessionId → { roomCode, playerId (current socket id), playerName }
const sessions = new Map<string, { roomCode: string; playerId: string; playerName: string }>();

const DEFAULT_SETTINGS: GameSettings = {
  maxPlayers: 4,
  turnTimerSeconds: null,
  botDifficulty: 'medium',
  variants: {
    stacking: false,
    jumpIn: false,
    sevenZero: false,
  },
};

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function toClientPlayer(player: Player): ClientPlayer {
  const { hand, ...rest } = player;
  return { ...rest, handSize: hand.length };
}

function generateSessionId(): string {
  return `sess_${crypto.randomUUID()}`;
}

export function createRoom(
  hostSocketId: string,
  hostName: string,
  settingsOverride?: Partial<GameSettings>
): { state: GameState; sessionId: string } {
  const code = generateRoomCode();
  const settings: GameSettings = { ...DEFAULT_SETTINGS, ...settingsOverride };
  if (settingsOverride?.variants) {
    settings.variants = { ...DEFAULT_SETTINGS.variants, ...settingsOverride.variants };
  }

  const host: Player = {
    id: hostSocketId,
    name: hostName,
    type: 'human',
    hand: [],
    saidUno: false,
    isConnected: true,
  };

  const state: GameState = {
    roomCode: code,
    phase: 'waiting',
    players: [host],
    deck: [],
    discardPile: [],
    currentPlayerIndex: 0,
    direction: 1,
    currentColor: 'red',
    pendingDrawCount: 0,
    turnStartTime: null,
    settings,
    winner: null,
    lastAction: '',
    hostId: hostSocketId,
    cumulativeScores: {},
    roundNumber: 0,
  };

  rooms.set(code, state);
  socketToRoom.set(hostSocketId, code);

  const sessionId = generateSessionId();
  sessions.set(sessionId, { roomCode: code, playerId: hostSocketId, playerName: hostName });

  return { state, sessionId };
}

export function joinRoom(
  roomCode: string,
  socketId: string,
  playerName: string
): { state: GameState; sessionId?: string; error?: string } {
  const state = rooms.get(roomCode);
  if (!state) return { state: null!, error: 'Room not found' };
  if (state.phase !== 'waiting') return { state: null!, error: 'Game already in progress' };
  if (state.players.length >= state.settings.maxPlayers) return { state: null!, error: 'Room is full' };
  if (state.players.some((p) => p.id === socketId)) return { state: null!, error: 'Already in room' };

  const player: Player = {
    id: socketId,
    name: playerName,
    type: 'human',
    hand: [],
    saidUno: false,
    isConnected: true,
  };

  state.players.push(player);
  socketToRoom.set(socketId, roomCode);

  const sessionId = generateSessionId();
  sessions.set(sessionId, { roomCode, playerId: socketId, playerName });

  return { state, sessionId };
}

export function leaveRoom(roomCode: string, socketId: string): GameState | null {
  const state = rooms.get(roomCode);
  if (!state) return null;

  state.players = state.players.filter((p) => p.id !== socketId);
  socketToRoom.delete(socketId);

  // If no players left, destroy the room
  if (state.players.filter((p) => p.type === 'human').length === 0) {
    rooms.delete(roomCode);
    return null;
  }

  // Transfer host if needed
  if (state.hostId === socketId) {
    const nextHuman = state.players.find((p) => p.type === 'human' && p.isConnected);
    if (nextHuman) {
      state.hostId = nextHuman.id;
    }
  }

  return state;
}

export function getRoom(roomCode: string): GameState | undefined {
  return rooms.get(roomCode);
}

export function getRoomBySocketId(socketId: string): GameState | undefined {
  const code = socketToRoom.get(socketId);
  if (!code) return undefined;
  return rooms.get(code);
}

export function getRoomCodeBySocketId(socketId: string): string | undefined {
  return socketToRoom.get(socketId);
}

export function updateSettings(
  roomCode: string,
  socketId: string,
  settingsUpdate: Partial<GameSettings>
): { state: GameState | null; error?: string } {
  const state = rooms.get(roomCode);
  if (!state) return { state: null, error: 'Room not found' };
  if (state.hostId !== socketId) return { state: null, error: 'Only the host can change settings' };
  if (state.phase !== 'waiting') return { state: null, error: 'Cannot change settings during game' };

  if (settingsUpdate.variants) {
    state.settings.variants = { ...state.settings.variants, ...settingsUpdate.variants };
  }
  const { variants: _, ...rest } = settingsUpdate;
  Object.assign(state.settings, rest);

  return { state };
}

export function isHost(roomCode: string, socketId: string): boolean {
  const state = rooms.get(roomCode);
  return state?.hostId === socketId;
}

export function startGame(roomCode: string, socketId: string): { state: GameState | null; error?: string } {
  const state = rooms.get(roomCode);
  if (!state) return { state: null, error: 'Room not found' };
  if (state.hostId !== socketId) return { state: null, error: 'Only the host can start the game' };
  // Need at least 2 total players (humans + bots that will be added)
  if (state.settings.maxPlayers < 2) return { state: null, error: 'Need at least 2 players' };

  // Fill remaining slots with bots
  const botsNeeded = state.settings.maxPlayers - state.players.length;
  for (let i = 0; i < botsNeeded; i++) {
    const bot: Player = {
      id: `bot_${crypto.randomUUID()}`,
      name: `Bot ${i + 1}`,
      type: 'bot',
      difficulty: state.settings.botDifficulty,
      hand: [],
      saidUno: false,
      isConnected: true,
    };
    state.players.push(bot);
  }

  // Create and shuffle deck
  const deck = shuffle(createDeck());

  // Deal 7 cards to each player
  const { hands, remaining } = dealHands(deck, state.players.length);
  for (let i = 0; i < state.players.length; i++) {
    state.players[i].hand = hands[i];
    state.players[i].saidUno = false;
  }

  // Get the starting discard card
  const { card: startCard, remaining: deckAfterStart } = getStartCard(remaining);

  state.deck = deckAfterStart;
  state.discardPile = [startCard];
  state.currentColor = startCard.isWild ? 'red' : startCard.color;
  state.currentPlayerIndex = 0;
  state.direction = 1;
  state.pendingDrawCount = 0;
  state.phase = 'playing';
  state.winner = null;
  state.turnStartTime = Date.now();
  state.roundNumber = 1;
  state.lastAction = 'Game started!';

  // Initialize cumulative scores for all players
  for (const p of state.players) {
    if (!(p.id in state.cumulativeScores)) {
      state.cumulativeScores[p.id] = 0;
    }
  }

  // Apply start card effects (skip, reverse, draw2)
  applyStartCardEffect(state, startCard);

  return { state };
}

function applyStartCardEffect(state: GameState, card: import('@/lib/types').UnoCard): void {
  const playerCount = state.players.length;

  switch (card.value) {
    case 'skip':
      // First player is skipped
      state.currentPlayerIndex = 1 % playerCount;
      state.lastAction = `First card is Skip — Player 1 is skipped`;
      break;
    case 'reverse':
      state.direction = -1;
      if (playerCount === 2) {
        state.currentPlayerIndex = 1;
      } else {
        state.currentPlayerIndex = (playerCount - 1) % playerCount;
      }
      state.lastAction = `First card is Reverse — direction reversed`;
      break;
    case 'draw2':
      // First player draws 2 and is skipped
      for (let i = 0; i < 2; i++) {
        if (state.deck.length > 0) {
          state.players[0].hand.push(state.deck.pop()!);
        }
      }
      state.currentPlayerIndex = 1 % playerCount;
      state.lastAction = `First card is Draw Two — ${state.players[0].name} draws 2`;
      break;
    case 'wild':
      // Wild as first card — first player picks a color (we'll default to red for now, color_pick phase later)
      state.currentColor = 'red';
      break;
    // wild_draw4 is prevented by getStartCard
  }
}

export function rematchGame(roomCode: string): { state: GameState | null; error?: string } {
  const state = rooms.get(roomCode);
  if (!state) return { state: null, error: 'Room not found' };
  if (state.phase !== 'finished') return { state: null, error: 'Game is not finished' };

  // Create and shuffle a new deck
  const deck = shuffle(createDeck());

  // Deal 7 cards to each player
  const { hands, remaining } = dealHands(deck, state.players.length);
  for (let i = 0; i < state.players.length; i++) {
    state.players[i].hand = hands[i];
    state.players[i].saidUno = false;
  }

  // Get the starting discard card
  const { card: startCard, remaining: deckAfterStart } = getStartCard(remaining);

  state.deck = deckAfterStart;
  state.discardPile = [startCard];
  state.currentColor = startCard.isWild ? 'red' : startCard.color;
  state.currentPlayerIndex = 0;
  state.direction = 1;
  state.pendingDrawCount = 0;
  state.phase = 'playing';
  state.winner = null;
  state.turnStartTime = Date.now();
  state.roundNumber += 1;
  state.lastAction = `Round ${state.roundNumber} started!`;

  // Apply start card effects
  applyStartCardEffect(state, startCard);

  return { state };
}

export function deleteRoom(roomCode: string): void {
  const state = rooms.get(roomCode);
  if (state) {
    for (const player of state.players) {
      socketToRoom.delete(player.id);
    }
    rooms.delete(roomCode);
  }
}
