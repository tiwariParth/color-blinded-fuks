'use client';

import { motion } from 'framer-motion';
import { CardBack } from '@/components/cards/CardBack';
import { useIsMobile } from '@/hooks/useIsMobile';

interface DrawPileProps {
  deckSize: number;
  canDraw: boolean;
  onDraw: () => void;
}

export function DrawPile({ deckSize, canDraw, onDraw }: DrawPileProps) {
  const isMobile = useIsMobile();
  const cardSize = isMobile ? 'md' as const : 'lg' as const;

  return (
    <div className="flex flex-col items-center gap-1.5 sm:gap-3">
      <motion.button
        onClick={canDraw ? onDraw : undefined}
        disabled={!canDraw}
        className="relative"
        whileHover={canDraw ? { scale: 1.06 } : {}}
        whileTap={canDraw ? { scale: 0.97 } : {}}
        style={{
          cursor: canDraw ? 'pointer' : 'default',
          opacity: canDraw ? 1 : 0.5,
        }}
      >
        {/* Pulse ring when drawable */}
        {canDraw && (
          <div
            className="absolute -inset-2 rounded-xl"
            style={{
              boxShadow: '0 0 20px 4px rgba(250,204,21,0.15)',
              animation: 'turn-pulse 2s ease-in-out infinite',
            }}
          />
        )}

        {/* Stack layers */}
        <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 opacity-15">
          <CardBack size={cardSize} />
        </div>
        <div className="absolute top-0.5 left-0.5 opacity-30">
          <CardBack size={cardSize} />
        </div>
        <div className="relative">
          <CardBack size={cardSize} />
        </div>

        {/* Count overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-1.5 sm:pb-2">
          <span className="rounded-full bg-black/50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold text-white/70 backdrop-blur-sm">
            {deckSize}
          </span>
        </div>
      </motion.button>

      {canDraw && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-yellow-500/70"
        >
          Draw
        </motion.span>
      )}
    </div>
  );
}
