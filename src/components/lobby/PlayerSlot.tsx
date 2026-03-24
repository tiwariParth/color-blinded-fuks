'use client';

import type { ClientPlayer } from '@/lib/types';

interface PlayerSlotProps {
  player: ClientPlayer;
  index: number;
  isHost: boolean;
  isYou: boolean;
}

export function PlayerSlot({ player, index, isHost, isYou }: PlayerSlotProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        isYou
          ? 'border-yellow-500/40 bg-yellow-500/5'
          : 'border-zinc-700/50 bg-zinc-800/30'
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-zinc-300">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-white">
            {player.name}
          </span>
          {isYou && (
            <span className="text-xs text-yellow-400">(you)</span>
          )}
          {isHost && (
            <span className="rounded bg-amber-600/20 px-1.5 py-0.5 text-xs font-medium text-amber-400">
              HOST
            </span>
          )}
          {player.type === 'bot' && (
            <span className="rounded bg-zinc-600/30 px-1.5 py-0.5 text-xs text-zinc-400">
              BOT
            </span>
          )}
        </div>
      </div>
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          player.isConnected ? 'bg-green-500' : 'bg-zinc-600'
        }`}
      />
    </div>
  );
}
