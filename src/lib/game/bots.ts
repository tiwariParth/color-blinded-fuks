import type { UnoCard, CardColor, GameState, Player, BotDifficulty } from '@/lib/types';
import { canPlayCard } from '@/lib/game/rules';

// ── Bot Turn Delays ─────────────────────────────────────────────────────────

export function getBotDelay(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case 'easy': return 1500 + Math.random() * 1000;   // 1500-2500ms
    case 'medium': return 800 + Math.random() * 700;    // 800-1500ms
    case 'hard': return 400 + Math.random() * 400;      // 400-800ms
  }
}

// ── Card Selection ──────────────────────────────────────────────────────────

export function chooseBotCard(
  state: GameState,
  bot: Player
): UnoCard | null {
  const topDiscard = state.discardPile[state.discardPile.length - 1];
  const playable = bot.hand.filter((card) =>
    canPlayCard(card, topDiscard, state.currentColor, state.pendingDrawCount, state.settings.variants)
  );

  if (playable.length === 0) return null;

  const difficulty = bot.difficulty || 'medium';

  switch (difficulty) {
    case 'easy': return chooseEasy(playable);
    case 'medium': return chooseMedium(playable, bot);
    case 'hard': return chooseHard(playable, bot, state);
  }
}

function chooseEasy(playable: UnoCard[]): UnoCard {
  // Random card
  return playable[Math.floor(Math.random() * playable.length)];
}

function chooseMedium(playable: UnoCard[], bot: Player): UnoCard {
  // Prefer action cards over numbers, save wilds for last
  const nonWild = playable.filter((c) => !c.isWild);
  const actions = nonWild.filter((c) =>
    ['skip', 'reverse', 'draw2'].includes(c.value)
  );
  const numbers = nonWild.filter((c) =>
    !['skip', 'reverse', 'draw2'].includes(c.value)
  );

  if (actions.length > 0) return actions[Math.floor(Math.random() * actions.length)];
  if (numbers.length > 0) return numbers[Math.floor(Math.random() * numbers.length)];
  // Only wilds left
  return playable[Math.floor(Math.random() * playable.length)];
}

function chooseHard(playable: UnoCard[], bot: Player, state: GameState): UnoCard {
  const nonWild = playable.filter((c) => !c.isWild);

  // If only wilds, play them
  if (nonWild.length === 0) {
    // Prefer regular wild over wild_draw4
    const regularWild = playable.find((c) => c.value === 'wild');
    return regularWild || playable[0];
  }

  // Find the next player (potential threat)
  const nextIdx = getNextPlayerIndex(state);
  const nextPlayer = state.players[nextIdx];

  // If next player has few cards, play action cards on them
  if (nextPlayer && nextPlayer.hand.length <= 3) {
    const offensive = nonWild.filter((c) =>
      ['skip', 'reverse', 'draw2'].includes(c.value)
    );
    if (offensive.length > 0) return offensive[0];
  }

  // Play the color we have the most of (to keep options open)
  const colorCounts = countColors(bot.hand);
  nonWild.sort((a, b) => (colorCounts[b.color] || 0) - (colorCounts[a.color] || 0));

  // Prefer action cards, then numbers
  const actions = nonWild.filter((c) =>
    ['skip', 'reverse', 'draw2'].includes(c.value)
  );
  if (actions.length > 0) return actions[0];

  return nonWild[0];
}

// ── Color Selection ─────────────────────────────────────────────────────────

export function chooseBotColor(bot: Player, difficulty: BotDifficulty): CardColor {
  const nonWildCards = bot.hand.filter((c) => !c.isWild);

  if (difficulty === 'easy' || nonWildCards.length === 0) {
    // Random color
    const colors: CardColor[] = ['red', 'yellow', 'green', 'blue'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Pick the color we have the most of
  const counts = countColors(nonWildCards);
  let bestColor: CardColor = 'red';
  let bestCount = 0;
  for (const [color, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count;
      bestColor = color as CardColor;
    }
  }
  return bestColor;
}

// ── UNO Call ────────────────────────────────────────────────────────────────

export function shouldBotSayUno(difficulty: BotDifficulty): boolean {
  switch (difficulty) {
    case 'easy': return Math.random() < 0.7;    // 70% chance
    case 'medium': return Math.random() < 0.95; // 95% chance
    case 'hard': return true;                    // always
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function countColors(cards: UnoCard[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const card of cards) {
    if (card.color !== 'wild') {
      counts[card.color] = (counts[card.color] || 0) + 1;
    }
  }
  return counts;
}

function getNextPlayerIndex(state: GameState): number {
  return (state.currentPlayerIndex + state.direction + state.players.length) % state.players.length;
}
