'use client';

import { useState, useEffect, useRef } from 'react';
import type { LogEntry, LogEntryType } from '@/lib/types';

const TYPE_COLOR: Record<LogEntryType, string> = {
  play: 'text-zinc-400',
  draw: 'text-blue-400/80',
  skip: 'text-orange-400/80',
  reverse: 'text-orange-400/80',
  wild: 'text-purple-400/80',
  uno: 'text-yellow-400',
  penalty: 'text-red-400',
  system: 'text-zinc-600',
};

interface GameLogProps {
  logs: LogEntry[];
}

export function GameLog({ logs }: GameLogProps) {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-800/60 bg-zinc-900/60 px-2.5 py-1.5 text-[10px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-400"
      >
        <span>Log</span>
        {logs.length > 0 && (
          <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-zinc-400 font-mono">{logs.length}</span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 sm:w-64 max-w-[85vw] rounded-xl border border-zinc-800/60 bg-zinc-950/95 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-zinc-800/40 px-2 sm:px-3 py-1.5 sm:py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Game Log</span>
            <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-400 text-xs">x</button>
          </div>
          <div className="max-h-44 sm:max-h-56 overflow-y-auto px-2 sm:px-3 py-2 space-y-0.5">
            {logs.length === 0 ? (
              <p className="text-[10px] text-zinc-700 text-center py-4">No actions yet</p>
            ) : (
              logs.map((entry) => (
                <div key={entry.id} className={`text-[11px] leading-relaxed ${TYPE_COLOR[entry.type]}`}>
                  {entry.message}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </div>
  );
}
