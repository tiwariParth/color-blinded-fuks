import type { GameState, ClientGameState, ClientPlayer } from '@/lib/types';

export function toClientState(state: GameState, socketId: string): ClientGameState {
  const myPlayer = state.players.find((p) => p.id === socketId);

  const players: ClientPlayer[] = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    difficulty: p.difficulty,
    saidUno: p.saidUno,
    isConnected: p.isConnected,
    handSize: p.hand.length,
  }));

  return {
    roomCode: state.roomCode,
    phase: state.phase,
    players,
    discardPile: state.discardPile,
    currentPlayerIndex: state.currentPlayerIndex,
    direction: state.direction,
    currentColor: state.currentColor,
    pendingDrawCount: state.pendingDrawCount,
    turnStartTime: state.turnStartTime,
    settings: state.settings,
    winner: state.winner,
    lastAction: state.lastAction,
    hostId: state.hostId,
    deckSize: state.deck.length,
    myHand: myPlayer?.hand || [],
    cumulativeScores: state.cumulativeScores,
    roundNumber: state.roundNumber,
  };
}
