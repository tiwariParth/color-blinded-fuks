'use client';

import { useState } from 'react';
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

const CHAOS_DESCRIPTIONS: Record<string, { name: string; effect: string }> = {
  trade_hands: { name: 'Trade Hands', effect: 'The player who played this card picks another player and swaps their entire hand with them.' },
  hand_bomb: { name: 'Hand Bomb', effect: 'The next player is forced to draw cards from the deck equal to half the bomber\'s hand size (minimum 2).' },
  reverse_roulette: { name: 'Reverse Roulette', effect: 'Every player passes their entire hand to the next player in the reverse direction.' },
  freeze: { name: 'Freeze', effect: 'The next 2 players are skipped. Play jumps ahead by 3 turns.' },
  tax_winner: { name: 'Tax the Winner', effect: 'The player currently holding the fewest cards is forced to draw 3 cards.' },
};

interface DiscardPileProps {
  topCard: UnoCardType | null;
  currentColor: CardColor;
}

export function DiscardPile({ topCard, currentColor }: DiscardPileProps) {
  const isMobile = useIsMobile();
  const cardSize = isMobile ? 'md' as const : 'lg' as const;
  const [showInfo, setShowInfo] = useState(false);

  const chaosInfo = topCard ? CHAOS_DESCRIPTIONS[topCard.value] : null;

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
              className={`relative ${chaosInfo ? 'cursor-pointer' : ''}`}
              onClick={() => chaosInfo && setShowInfo(true)}
            >
              <UnoCard card={topCard} playable={false} size={cardSize} />
              {/* Tap hint for chaos cards */}
              {chaosInfo && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-purple-600/90 px-1.5 py-0.5 text-[7px] sm:text-[8px] font-bold text-white shadow-md whitespace-nowrap">
                  tap for info
                </div>
              )}
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

      {/* Chaos card info modal */}
      <AnimatePresence>
        {showInfo && chaosInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="mx-4 w-full max-w-xs rounded-xl border border-purple-500/30 bg-zinc-900/95 p-5 shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card preview */}
              <div className="mb-3 flex justify-center">
                {topCard && <UnoCard card={topCard} playable={false} size="lg" />}
              </div>
              <h3 className="text-lg font-bold text-purple-300">{chaosInfo.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{chaosInfo.effect}</p>
              <button
                onClick={() => setShowInfo(false)}
                className="mt-4 rounded-lg bg-purple-600/80 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
