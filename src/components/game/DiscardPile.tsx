'use client';

import type { UnoCard as UnoCardType, CardColor } from '@/lib/types';
import { UnoCard } from '@/components/cards/UnoCard';

const COLOR_DISPLAY: Record<string, { label: string; className: string }> = {
  red: { label: 'Red', className: 'bg-red-600' },
  yellow: { label: 'Yellow', className: 'bg-yellow-500' },
  green: { label: 'Green', className: 'bg-green-600' },
  blue: { label: 'Blue', className: 'bg-blue-600' },
  wild: { label: 'Wild', className: 'bg-zinc-600' },
};

interface DiscardPileProps {
  topCard: UnoCardType | null;
  currentColor: CardColor;
}

export function DiscardPile({ topCard, currentColor }: DiscardPileProps) {
  const colorInfo = COLOR_DISPLAY[currentColor] || COLOR_DISPLAY.wild;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {/* Shadow cards underneath for pile effect */}
        <div className="absolute top-1 left-1 opacity-30">
          {topCard && <UnoCard card={topCard} playable={false} size="lg" />}
        </div>
        <div className="relative">
          {topCard ? (
            <UnoCard card={topCard} playable={false} size="lg" />
          ) : (
            <div className="w-[84px] h-[120px] rounded-lg border-2 border-dashed border-zinc-600 flex items-center justify-center">
              <span className="text-zinc-600 text-xs">Empty</span>
            </div>
          )}
        </div>
      </div>

      {/* Current color indicator */}
      <div className="flex items-center gap-1.5">
        <div className={`h-4 w-4 rounded-full ${colorInfo.className}`} />
        <span className="text-xs text-zinc-400">{colorInfo.label}</span>
      </div>
    </div>
  );
}
