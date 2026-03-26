'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UnoCard as UnoCardType } from '@/lib/types';
import { UnoCard } from '@/components/cards/UnoCard';
import { useIsMobile } from '@/hooks/useIsMobile';

const CHAOS_INFO: Record<string, string> = {
  trade_hands: 'Swap your entire hand with another player.',
  hand_bomb: 'Give half your cards to the next player.',
  reverse_roulette: 'Everyone passes their hand in reverse.',
  freeze: 'Skip the next 2 players.',
  tax_winner: 'Player with fewest cards draws 3.',
};

interface CardHandProps {
  cards: UnoCardType[];
  playableCardIds: Set<string>;
  onPlayCard: (cardId: string) => void;
  isMyTurn: boolean;
}

export function CardHand({ cards, playableCardIds, onPlayCard, isMyTurn }: CardHandProps) {
  const isMobile = useIsMobile();
  const [hoveredChaos, setHoveredChaos] = useState<string | null>(null);
  const count = cards.length;
  const maxSpread = isMobile ? Math.min(count * 2, 20) : Math.min(count * 3, 30);
  const overlapPx = isMobile
    ? (count > 8 ? -26 : count > 5 ? -20 : -12)
    : (count > 8 ? -16 : count > 5 ? -10 : -4);
  const cardSize = isMobile ? 'sm' as const : 'md' as const;

  const isChaos = (value: string) => value in CHAOS_INFO;

  return (
    <div className="relative flex items-end justify-center py-2 sm:py-4 px-1 sm:px-2 overflow-x-auto">
      {/* Hover tooltip — rendered outside card stacking context so it's always on top */}
      <AnimatePresence>
        {hoveredChaos && CHAOS_INFO[hoveredChaos] && (
          <motion.div
            key="chaos-tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute top-0 left-1/2 z-[100] -translate-x-1/2 -translate-y-full"
          >
            <div className="rounded-lg border border-purple-500/30 bg-zinc-900/95 px-3 py-2 shadow-2xl backdrop-blur-sm whitespace-nowrap">
              <span className="text-[11px] sm:text-xs font-semibold text-purple-300">
                {hoveredChaos.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              <span className="text-[11px] sm:text-xs text-zinc-400"> — {CHAOS_INFO[hoveredChaos]}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cards.map((card, index) => {
          const isPlayable = isMyTurn && playableCardIds.has(card.id);
          const mid = (count - 1) / 2;
          const offset = index - mid;
          const rotate = count > 1 ? (offset / mid) * maxSpread : 0;
          const arcY = Math.abs(offset) * (count > 5 ? (isMobile ? 2 : 3) : 1.5);
          const chaos = isChaos(card.value);

          // Chaos cards always lift on hover (so user can read tooltip), playable cards lift + scale
          const hoverAnim = isPlayable
            ? { y: isMobile ? -16 : -24, scale: 1.12, rotate: 0, zIndex: 50 }
            : chaos
              ? { y: isMobile ? -12 : -18, zIndex: 50 }
              : {};

          return (
            <motion.div
              key={card.id}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: arcY, opacity: 1, rotate }}
              exit={{ y: -80, opacity: 0 }}
              whileHover={hoverAnim}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="relative"
              style={{
                marginLeft: index === 0 ? 0 : overlapPx,
                zIndex: index,
                transformOrigin: 'center bottom',
              }}
              onMouseEnter={() => chaos && setHoveredChaos(card.value)}
              onMouseLeave={() => chaos && setHoveredChaos(null)}
              onTouchStart={() => chaos && setHoveredChaos(card.value)}
              onTouchEnd={() => chaos && setTimeout(() => setHoveredChaos(null), 2000)}
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
