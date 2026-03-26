import type { UnoCard, CardColor, GameState } from '@/lib/types';
import { shuffle } from '@/lib/game/deck';

export function canPlayCard(
  card: UnoCard,
  topDiscard: UnoCard,
  currentColor: CardColor,
  pendingDrawCount: number,
  variants: { stacking: boolean }
): boolean {
  // If there's a pending draw stack, only matching draw cards can be played (if stacking is on)
  if (pendingDrawCount > 0) {
    if (!variants.stacking) return false;
    if (topDiscard.value === 'draw2' && card.value === 'draw2') return true;
    if (topDiscard.value === 'wild_draw4' && card.value === 'wild_draw4') return true;
    return false;
  }

  // Wilds can always be played
  if (card.isWild) return true;

  // Color match
  if (card.color === currentColor) return true;

  // Value match
  if (card.value === topDiscard.value) return true;

  return false;
}

export function nextPlayerIndex(
  currentIndex: number,
  direction: 1 | -1,
  playerCount: number
): number {
  return (currentIndex + direction + playerCount) % playerCount;
}

export function applyCardEffect(
  state: GameState,
  card: UnoCard,
  chosenColor?: CardColor
): GameState {
  const playerCount = state.players.length;

  // Place card on discard pile
  state.discardPile.push(card);

  // Update current color
  if (card.isWild) {
    state.currentColor = chosenColor || 'red';
  } else {
    state.currentColor = card.color;
  }

  switch (card.value) {
    case 'skip': {
      // Skip next player
      const skipped = nextPlayerIndex(state.currentPlayerIndex, state.direction, playerCount);
      state.currentPlayerIndex = nextPlayerIndex(skipped, state.direction, playerCount);
      state.lastAction = `${getCurrentPlayerName(state)} played Skip`;
      break;
    }

    case 'reverse': {
      state.direction = (state.direction === 1 ? -1 : 1) as 1 | -1;
      if (playerCount === 2) {
        // In 2-player, reverse acts as skip
        state.currentPlayerIndex = nextPlayerIndex(
          state.currentPlayerIndex,
          state.direction,
          playerCount
        );
        // Skip the next (which is the same player who just got reversed to)
        state.currentPlayerIndex = nextPlayerIndex(
          state.currentPlayerIndex,
          state.direction,
          playerCount
        );
      } else {
        state.currentPlayerIndex = nextPlayerIndex(
          state.currentPlayerIndex,
          state.direction,
          playerCount
        );
      }
      state.lastAction = `${getCurrentPlayerName(state)} played Reverse`;
      break;
    }

    case 'draw2': {
      if (state.settings.variants.stacking) {
        state.pendingDrawCount += 2;
        state.currentPlayerIndex = nextPlayerIndex(
          state.currentPlayerIndex,
          state.direction,
          playerCount
        );
      } else {
        const nextIdx = nextPlayerIndex(state.currentPlayerIndex, state.direction, playerCount);
        drawCards(state, nextIdx, 2);
        // Skip the drawing player
        state.currentPlayerIndex = nextPlayerIndex(nextIdx, state.direction, playerCount);
      }
      state.lastAction = `${getCurrentPlayerName(state)} played Draw Two`;
      break;
    }

    case 'wild': {
      state.currentPlayerIndex = nextPlayerIndex(
        state.currentPlayerIndex,
        state.direction,
        playerCount
      );
      state.lastAction = `${getCurrentPlayerName(state)} played Wild`;
      break;
    }

    case 'wild_draw4': {
      if (state.settings.variants.stacking) {
        state.pendingDrawCount += 4;
        state.currentPlayerIndex = nextPlayerIndex(
          state.currentPlayerIndex,
          state.direction,
          playerCount
        );
      } else {
        const nextIdx = nextPlayerIndex(state.currentPlayerIndex, state.direction, playerCount);
        drawCards(state, nextIdx, 4);
        state.currentPlayerIndex = nextPlayerIndex(nextIdx, state.direction, playerCount);
      }
      state.lastAction = `${getCurrentPlayerName(state)} played Wild Draw Four`;
      break;
    }

    case 'trade_hands': {
      // Server will handle the swap after player picks target
      // Don't advance turn — goes to swap_pick phase
      state.phase = 'swap_pick';
      state.lastAction = `is choosing who to swap hands with...`;
      break;
    }

    case 'hand_bomb': {
      // Next player takes half of current player's cards (rounded up)
      const bomber = state.players[state.currentPlayerIndex];
      const victimIdx = nextPlayerIndex(state.currentPlayerIndex, state.direction, playerCount);
      const victim = state.players[victimIdx];
      const count = Math.ceil(bomber.hand.length / 2);
      const donated = bomber.hand.splice(0, count);
      victim.hand.push(...donated);
      state.currentPlayerIndex = nextPlayerIndex(victimIdx, state.direction, playerCount);
      state.lastAction = `${bomber.name} bombed ${victim.name} with ${count} cards!`;
      break;
    }

    case 'reverse_roulette': {
      // Everyone passes their hand to the next player in REVERSE direction
      const hands = state.players.map((p) => p.hand);
      for (let i = 0; i < state.players.length; i++) {
        const receiverIdx = ((i - state.direction) + state.players.length) % state.players.length;
        state.players[i].hand = hands[receiverIdx];
      }
      state.currentPlayerIndex = nextPlayerIndex(
        state.currentPlayerIndex,
        state.direction,
        playerCount
      );
      state.lastAction = `Reverse Roulette! All hands rotated!`;
      break;
    }

    case 'freeze': {
      // Skip next 2 players
      let idx = state.currentPlayerIndex;
      for (let i = 0; i < 3; i++) {
        idx = nextPlayerIndex(idx, state.direction, playerCount);
      }
      state.currentPlayerIndex = idx;
      state.lastAction = `Freeze! Next 2 players skipped!`;
      break;
    }

    case 'tax_winner': {
      // Player with fewest cards draws 3
      let minCards = Infinity;
      let targetIdx = -1;
      for (let i = 0; i < state.players.length; i++) {
        if (i === state.currentPlayerIndex) continue; // not the player who played it
        if (state.players[i].hand.length < minCards) {
          minCards = state.players[i].hand.length;
          targetIdx = i;
        }
      }
      if (targetIdx >= 0) {
        drawCards(state, targetIdx, 3);
        state.lastAction = `Tax the Winner! ${state.players[targetIdx].name} drew 3 cards!`;
      }
      state.currentPlayerIndex = nextPlayerIndex(
        state.currentPlayerIndex,
        state.direction,
        playerCount
      );
      break;
    }

    default: {
      // Number card — just advance turn
      state.currentPlayerIndex = nextPlayerIndex(
        state.currentPlayerIndex,
        state.direction,
        playerCount
      );
      state.lastAction = `played ${card.color} ${card.value}`;
      break;
    }
  }

  state.turnStartTime = Date.now();
  return state;
}

export function drawCards(state: GameState, playerIndex: number, count: number): void {
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      reshuffleDeck(state);
    }
    if (state.deck.length === 0) break; // truly empty, shouldn't happen
    const card = state.deck.pop()!;
    state.players[playerIndex].hand.push(card);
  }
}

function reshuffleDeck(state: GameState): void {
  if (state.discardPile.length <= 1) return;
  const topCard = state.discardPile.pop()!;
  state.deck = shuffle(state.discardPile);
  state.discardPile = [topCard];
}

export function checkWinCondition(state: GameState, playerIndex: number): boolean {
  return state.players[playerIndex].hand.length === 0;
}

export function getPlayableCards(
  hand: UnoCard[],
  topDiscard: UnoCard,
  currentColor: CardColor,
  pendingDrawCount: number,
  variants: { stacking: boolean }
): UnoCard[] {
  return hand.filter((card) =>
    canPlayCard(card, topDiscard, currentColor, pendingDrawCount, variants)
  );
}

function getCurrentPlayerName(state: GameState): string {
  return state.players[state.currentPlayerIndex]?.name || 'Unknown';
}
