'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { UnoCard as UnoCardType } from '@/lib/types';
import { UnoCard } from '@/components/cards/UnoCard';
import { useIsMobile } from '@/hooks/useIsMobile';

interface CardHandProps {
  cards: UnoCardType[];
  playableCardIds: Set<string>;
  onPlayCard: (cardId: string) => void;
  isMyTurn: boolean;
}

export function CardHand({ cards, playableCardIds, onPlayCard, isMyTurn }: CardHandProps) {
  const isMobile = useIsMobile();
  const count = cards.length;
  const maxSpread = isMobile ? Math.min(count * 2, 20) : Math.min(count * 3, 30);
  const overlapPx = isMobile
    ? (count > 8 ? -26 : count > 5 ? -20 : -12)
    : (count > 8 ? -16 : count > 5 ? -10 : -4);
  const cardSize = isMobile ? 'sm' as const : 'md' as const;

  return (
    <div className="flex items-end justify-center py-2 sm:py-4 px-1 sm:px-2 overflow-x-auto">
      <AnimatePresence>
        {cards.map((card, index) => {
          const isPlayable = isMyTurn && playableCardIds.has(card.id);
          const mid = (count - 1) / 2;
          const offset = index - mid;
          const rotate = count > 1 ? (offset / mid) * maxSpread : 0;
          const arcY = Math.abs(offset) * (count > 5 ? (isMobile ? 2 : 3) : 1.5);

          return (
            <motion.div
              key={card.id}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: arcY, opacity: 1, rotate }}
              exit={{ y: -80, opacity: 0 }}
              whileHover={isPlayable ? { y: isMobile ? -16 : -24, scale: 1.12, rotate: 0, zIndex: 50 } : {}}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="relative"
              style={{
                marginLeft: index === 0 ? 0 : overlapPx,
                zIndex: index,
                transformOrigin: 'center bottom',
              }}
            >
              {/* Playable glow ring */}
              {isPlayable && (
                <div
                  className="card-playable-ring pointer-events-none absolute -inset-1 rounded-lg"
                  style={{
                    boxShadow: `0 0 12px 2px ${card.color === 'wild' ? 'rgba(255,255,255,0.2)' : card.color === 'red' ? 'rgba(224,58,42,0.4)' : card.color === 'yellow' ? 'rgba(245,200,0,0.4)' : card.color === 'green' ? 'rgba(61,170,79,0.4)' : 'rgba(42,109,181,0.4)'}`,
                  }}
                />
              )}
              <UnoCard
                card={card}
                playable={isPlayable}
                onClick={isPlayable ? () => onPlayCard(card.id) : undefined}
                size={cardSize}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
