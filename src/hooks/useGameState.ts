import { create } from 'zustand';
import type {
  ClientPlayer,
  ClientGameState,
  GameSettings,
  GamePhase,
  UnoCard,
} from '@/lib/types';

interface GameStore {
  // Connection
  roomCode: string | null;
  playerId: string | null;

  // Lobby
  players: ClientPlayer[];
  settings: GameSettings | null;
  hostId: string | null;
  phase: GamePhase;

  // Game
  gameState: ClientGameState | null;
  myHand: UnoCard[];

  // Results
  winnerId: string | null;
  scores: Record<string, number> | null;
  cumulativeScores: Record<string, number>;
  roundNumber: number;

  // UI
  error: string | null;

  // Actions
  setRoomInfo: (roomCode: string, playerId: string) => void;
  updateLobby: (players: ClientPlayer[], settings: GameSettings, hostId: string) => void;
  setGameState: (state: ClientGameState) => void;
  setWinner: (winnerId: string, scores: Record<string, number>) => void;
  clearRoundResult: () => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

const initialState = {
  roomCode: null,
  playerId: null,
  players: [],
  settings: null,
  hostId: null,
  phase: 'waiting' as GamePhase,
  gameState: null,
  myHand: [],
  winnerId: null,
  scores: null,
  cumulativeScores: {} as Record<string, number>,
  roundNumber: 0,
  error: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setRoomInfo: (roomCode, playerId) => set({ roomCode, playerId, error: null }),

  updateLobby: (players, settings, hostId) => set({ players, settings, hostId }),

  setGameState: (state) =>
    set({
      gameState: state,
      myHand: state.myHand,
      phase: state.phase,
      players: state.players,
      cumulativeScores: state.cumulativeScores,
      roundNumber: state.roundNumber,
    }),

  setWinner: (winnerId, scores) => set({ winnerId, scores }),

  clearRoundResult: () => set({ winnerId: null, scores: null }),

  setError: (message) => set({ error: message }),

  reset: () => set(initialState),
}));
