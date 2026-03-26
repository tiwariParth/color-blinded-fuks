'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { UnoCard as UnoCardType, CardColor } from '@/lib/types';
import { UnoCard } from '@/components/cards/UnoCard';
import { useIsMobile } from '@/hooks/useIsMobile';

const COLOR_GLOW: Record<string, string> = {
  red: '0 0 30px 8px rgba(224,58,42,0.35)',
  yellow: '0 0 30px 8px rgba(245,200,0,0.3)',
  green: '0 0 30px 8px rgba(61,170,79,0.35)',
  blue: '0 0 30px 8px rgba(42,109,181,0.35)',
  wild: '0 0 20px 6px rgba(200,200,200,0.15)',
};

const COLOR_BG: Record<string, string> = {
  red: '#E03A2A',
  yellow: '#F5C800',
  green: '#3DAA4F',
  blue: '#2A6DB5',
  wild: '#666',
};

interface DiscardPileProps {
  topCard: UnoCardType | null;
  currentColor: CardColor;
}

export function DiscardPile({ topCard, currentColor }: DiscardPileProps) {
  const isMobile = useIsMobile();
  const cardSize = isMobile ? 'md' as const : 'lg' as const;

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-3">
      <div
        className="relative rounded-xl transition-all duration-500"
        style={{ boxShadow: COLOR_GLOW[currentColor] || COLOR_GLOW.wild }}
      >
        {/* Shadow pile layers */}
        <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 opacity-15 blur-[1px]">
          {topCard && <UnoCard card={topCard} playable={false} size={cardSize} />}
        </div>
        <div className="absolute top-0.5 left-0.5 opacity-25">
          {topCard && <UnoCard card={topCard} playable={false} size={cardSize} />}
        </div>

        {/* Top card */}
        <AnimatePresence mode="wait">
          {topCard ? (
            <motion.div
              key={topCard.id}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <UnoCard card={topCard} playable={false} size={cardSize} />
            </motion.div>
          ) : (
            <div className="flex h-[100px] w-[70px] sm:h-[120px] sm:w-[84px] items-center justify-center rounded-lg border border-dashed border-zinc-600/30">
              <span className="text-zinc-700 text-[10px] sm:text-xs">Discard</span>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Current color dot */}
      <div className="flex items-center gap-1.5">
        <div
          className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full transition-colors duration-500"
          style={{
            backgroundColor: COLOR_BG[currentColor] || COLOR_BG.wild,
            boxShadow: `0 0 8px ${COLOR_BG[currentColor] || COLOR_BG.wild}88`,
          }}
        />
        <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {currentColor}
        </span>
      </div>
    </div>
  );
}
