'use client';

import type { ClientPlayer } from '@/lib/types';

const AVATAR_COLORS = ['#E03A2A', '#2A6DB5', '#3DAA4F', '#F5C800', '#9333ea', '#ec4899', '#f97316', '#06b6d4'];

interface PlayerSlotProps {
  player: ClientPlayer;
  index: number;
  isHost: boolean;
  isYou: boolean;
}

export function PlayerSlot({ player, index, isHost, isYou }: PlayerSlotProps) {
  const hash = player.name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
        isYou
          ? 'border-yellow-500/20 bg-yellow-500/5'
          : 'border-zinc-800/60 bg-zinc-900/40'
      }`}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {player.type === 'bot' ? '~' : player.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-zinc-200">
            {player.name}
          </span>
          {isYou && (
            <span className="text-[10px] text-yellow-500/70">you</span>
          )}
          {isHost && (
            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400/80">
              HOST
            </span>
          )}
          {player.type === 'bot' && (
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
              BOT
            </span>
          )}
        </div>
      </div>
      <div
        className={`h-2 w-2 rounded-full ${
          player.isConnected ? 'bg-green-500' : 'bg-zinc-700'
        }`}
        style={player.isConnected ? { boxShadow: '0 0 6px rgba(34,197,94,0.4)' } : {}}
      />
    </div>
  );
}
