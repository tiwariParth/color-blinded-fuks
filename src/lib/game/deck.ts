import type { UnoCard, CardColor, CardValue } from '@/lib/types';

const COLORS: CardColor[] = ['red', 'yellow', 'green', 'blue'];

const NUMBER_VALUES: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTION_VALUES: CardValue[] = ['skip', 'reverse', 'draw2'];

export function createDeck(): UnoCard[] {
  const cards: UnoCard[] = [];
  let idCounter = 0;

  for (const color of COLORS) {
    // One 0 per color
    cards.push({
      id: `${color}_0_${idCounter++}`,
      color,
      value: '0',
      isWild: false,
    });

    // Two of each 1-9 per color
    for (const value of NUMBER_VALUES.slice(1)) {
      for (let i = 0; i < 2; i++) {
        cards.push({
          id: `${color}_${value}_${idCounter++}`,
          color,
          value,
          isWild: false,
        });
      }
    }

    // Two of each action card per color
    for (const value of ACTION_VALUES) {
      for (let i = 0; i < 2; i++) {
        cards.push({
          id: `${color}_${value}_${idCounter++}`,
          color,
          value,
          isWild: false,
        });
      }
    }
  }

  // 4 Wild cards
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `wild_${idCounter++}`,
      color: 'wild',
      value: 'wild',
      isWild: true,
    });
  }

  // 4 Wild Draw Four cards
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `wild_draw4_${idCounter++}`,
      color: 'wild',
      value: 'wild_draw4',
      isWild: true,
    });
  }

  // 1 of each chaos/power card (all wild)
  const CHAOS_CARDS: CardValue[] = ['trade_hands', 'hand_bomb', 'reverse_roulette', 'freeze', 'tax_winner'];
  for (const value of CHAOS_CARDS) {
    cards.push({
      id: `chaos_${value}_${idCounter++}`,
      color: 'wild',
      value,
      isWild: true,
    });
  }

  return cards;
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealHands(
  deck: UnoCard[],
  playerCount: number,
  cardsPerPlayer = 7
): { hands: UnoCard[][]; remaining: UnoCard[] } {
  const remaining = [...deck];
  const hands: UnoCard[][] = [];

  for (let p = 0; p < playerCount; p++) {
    hands.push(remaining.splice(0, cardsPerPlayer));
  }

  return { hands, remaining };
}

export function getStartCard(deck: UnoCard[]): { card: UnoCard; remaining: UnoCard[] } {
  const remaining = [...deck];

  let idx = 0;
  // The first discard card must not be a Wild Draw Four or chaos card
  while (remaining[idx].isWild) {
    idx++;
  }

  const [card] = remaining.splice(idx, 1);

  // If we skipped any Wild+4 cards, put them back and reshuffle
  if (idx > 0) {
    return { card, remaining: shuffle(remaining) };
  }

  return { card, remaining };
}
