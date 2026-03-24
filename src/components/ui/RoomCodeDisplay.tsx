'use client';

import { useState } from 'react';

export function RoomCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/50 px-6 py-4 transition-colors hover:border-zinc-500"
    >
      <span className="font-mono text-3xl font-bold tracking-[0.3em] text-white">
        {code}
      </span>
      <span className="text-xs text-zinc-500 group-hover:text-zinc-300">
        {copied ? 'Copied!' : 'Click to copy'}
      </span>
    </button>
  );
}
