'use client';

import { AnimatePresence, motion } from 'framer-motion';
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
      className={`relative flex flex-col items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2.5 transition-all duration-300 ${
        isCurrentTurn
          ? 'turn-ring bg-yellow-400/8'
          : 'bg-zinc-800/20'
      }`}
      style={isCurrentTurn ? { boxShadow: '0 0 20px rgba(250,204,21,0.15)' } : {}}
    >
      {/* Avatar */}
      <div
        className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full text-[10px] sm:text-sm font-bold text-white"
        style={{ backgroundColor: avatarColor, boxShadow: `0 0 10px ${avatarColor}44` }}
      >
        {player.type === 'bot' ? '~' : initial}
      </div>

      {/* Name */}
      <span className="max-w-[52px] sm:max-w-[72px] truncate text-[10px] sm:text-xs font-medium text-zinc-300">
        {player.name}
      </span>

      {/* Mini card fan */}
      <div className="relative flex items-center justify-center" style={{ height: 28, width: Math.min(player.handSize * 5 + 18, 64) }}>
        {Array.from({ length: Math.min(player.handSize, 8) }).map((_, i, arr) => {
          const count = arr.length;
          const mid = (count - 1) / 2;
          const angle = (i - mid) * 5;
          const offsetX = (i - mid) * 4;
          return (
            <svg
              key={i}
              width="16"
              height="24"
              viewBox="0 0 70 100"
              className="absolute select-none"
              style={{
                transform: `translateX(${offsetX}px) rotate(${angle}deg)`,
                transformOrigin: 'center bottom',
                zIndex: i,
              }}
            >
              <rect width="70" height="100" rx="8" fill="#1a1a2e" stroke="#333" strokeWidth="2" />
              <rect x="5" y="5" width="60" height="90" rx="5" fill="none" stroke="#e03a2a" strokeWidth="3" />
              <ellipse cx="35" cy="50" rx="18" ry="26" fill="#e03a2a" transform="rotate(-15, 35, 50)" />
            </svg>
          );
        })}
        <span className="absolute -bottom-1 right-0 rounded-full bg-zinc-900/90 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-zinc-300 ring-1 ring-zinc-700/60" style={{ zIndex: 20 }}>
          {player.handSize}
        </span>
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
