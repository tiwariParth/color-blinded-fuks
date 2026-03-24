'use client';

import { CardBack } from '@/components/cards/CardBack';

interface DrawPileProps {
  deckSize: number;
  canDraw: boolean;
  onDraw: () => void;
}

export function DrawPile({ deckSize, canDraw, onDraw }: DrawPileProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={canDraw ? onDraw : undefined}
        disabled={!canDraw}
        className={`relative transition-transform ${
          canDraw ? 'hover:scale-105 cursor-pointer' : 'opacity-60'
        }`}
      >
        {/* Stack effect */}
        <div className="absolute top-0.5 left-0.5 opacity-40">
          <CardBack size="lg" />
        </div>
        <div className="absolute top-1 left-1 opacity-20">
          <CardBack size="lg" />
        </div>
        <div className="relative">
          <CardBack size="lg" />
        </div>
      </button>
      <span className="text-xs text-zinc-500">{deckSize} cards</span>
      {canDraw && (
        <span className="text-xs text-yellow-400">Click to draw</span>
      )}
    </div>
  );
}
