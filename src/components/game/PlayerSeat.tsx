'use client';

import { AnimatePresence } from 'framer-motion';
import type { ClientPlayer } from '@/lib/types';
import { CardBack } from '@/components/cards/CardBack';
import { UnoButton } from '@/components/game/UnoButton';

interface PlayerSeatProps {
  player: ClientPlayer;
  isCurrentTurn: boolean;
  isYou: boolean;
  canCatch?: boolean;
  onCatch?: () => void;
}

export function PlayerSeat({ player, isCurrentTurn, isYou, canCatch, onCatch }: PlayerSeatProps) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${
        isCurrentTurn
          ? 'bg-yellow-500/10 ring-2 ring-yellow-400/60'
          : 'bg-zinc-800/30'
      }`}
    >
      {/* Card count indicator */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: Math.min(player.handSize, 5) }).map((_, i) => (
          <div key={i} className="-ml-3 first:ml-0">
            <CardBack size="sm" />
          </div>
        ))}
        {player.handSize > 5 && (
          <span className="ml-1 text-xs text-zinc-400">+{player.handSize - 5}</span>
        )}
      </div>

      {/* Player info */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-sm font-medium text-zinc-200 truncate max-w-[80px]">
          {player.name}
        </span>
        {isYou && <span className="text-xs text-yellow-400">(you)</span>}
        {player.type === 'bot' && (
          <span className="text-xs text-zinc-500">🤖</span>
        )}
      </div>

      {/* UNO badge */}
      {player.handSize === 1 && player.saidUno && (
        <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white animate-pulse">
          UNO!
        </span>
      )}

      {/* Catch button — shown when opponent has 1 card and didn't say UNO */}
      <AnimatePresence>
        {canCatch && onCatch && (
          <UnoButton onClick={onCatch} label="Catch!" variant="catch" />
        )}
      </AnimatePresence>

      {/* Card count */}
      <span className="text-xs text-zinc-500">{player.handSize} cards</span>
    </div>
  );
}
