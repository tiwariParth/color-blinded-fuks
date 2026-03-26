'use client';

import { AnimatePresence } from 'framer-motion';
import type { ClientPlayer } from '@/lib/types';
import { UnoButton } from '@/components/game/UnoButton';

const AVATAR_COLORS = ['#E03A2A', '#2A6DB5', '#3DAA4F', '#F5C800', '#9333ea', '#ec4899', '#f97316', '#06b6d4'];

interface PlayerSeatProps {
  player: ClientPlayer;
  isCurrentTurn: boolean;
  isYou: boolean;
  canCatch?: boolean;
  onCatch?: () => void;
}

export function PlayerSeat({ player, isCurrentTurn, isYou, canCatch, onCatch }: PlayerSeatProps) {
  // Stable color from player name hash
  const hash = player.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const avatarColor = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const initial = player.name.charAt(0).toUpperCase();

  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 rounded-xl px-4 py-2.5 transition-all duration-300 ${
        isCurrentTurn
          ? 'turn-ring bg-yellow-400/8'
          : 'bg-zinc-800/20'
      }`}
      style={isCurrentTurn ? { boxShadow: '0 0 20px rgba(250,204,21,0.15)' } : {}}
    >
      {/* Avatar */}
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: avatarColor, boxShadow: `0 0 10px ${avatarColor}44` }}
      >
        {player.type === 'bot' ? '~' : initial}
      </div>

      {/* Name */}
      <span className="max-w-[72px] truncate text-xs font-medium text-zinc-300">
        {player.name}
      </span>

      {/* Card count pill */}
      <div className="flex items-center gap-1 rounded-full bg-zinc-800/60 px-2 py-0.5">
        <span className="text-[10px] font-mono text-zinc-400">{player.handSize}</span>
        <svg width="10" height="14" viewBox="0 0 70 100" className="opacity-40">
          <rect width="70" height="100" rx="10" fill="#888" />
        </svg>
      </div>

      {/* UNO badge */}
      {player.handSize === 1 && player.saidUno && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white"
          style={{ boxShadow: '0 0 12px rgba(224,58,42,0.5)' }}
        >
          UNO!
        </motion.span>
      )}

      {/* Catch */}
      <AnimatePresence>
        {canCatch && onCatch && (
          <UnoButton onClick={onCatch} label="Catch!" variant="catch" />
        )}
      </AnimatePresence>
    </div>
  );
}
