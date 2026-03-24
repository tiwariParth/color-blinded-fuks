'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { UnoCard as UnoCardType, CardColor } from '@/lib/types';
import { UnoCard } from '@/components/cards/UnoCard';

interface CardHandProps {
  cards: UnoCardType[];
  playableCardIds: Set<string>;
  onPlayCard: (cardId: string) => void;
  isMyTurn: boolean;
}

export function CardHand({ cards, playableCardIds, onPlayCard, isMyTurn }: CardHandProps) {
  return (
    <div className="flex items-end justify-center gap-0 py-4 px-2 overflow-x-auto">
      <AnimatePresence mode="popLayout">
        {cards.map((card, index) => {
          const isPlayable = isMyTurn && playableCardIds.has(card.id);

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ y: 60, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -120, opacity: 0, scale: 0.8 }}
              whileHover={isPlayable ? { y: -20, scale: 1.1, zIndex: 50 } : {}}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative"
              style={{
                marginLeft: index === 0 ? 0 : -12,
                zIndex: index,
              }}
            >
              <UnoCard
                card={card}
                playable={isPlayable}
                onClick={isPlayable ? () => onPlayCard(card.id) : undefined}
                size="md"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
