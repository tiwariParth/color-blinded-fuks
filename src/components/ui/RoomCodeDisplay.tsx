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
      className="group mx-auto flex items-center gap-2 sm:gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-4 sm:px-6 py-2.5 sm:py-3.5 transition-all hover:border-zinc-700"
    >
      <span className="font-mono text-lg sm:text-2xl font-bold tracking-[0.3em] text-white">
        {code}
      </span>
      <span className="text-[10px] text-zinc-600 transition-colors group-hover:text-zinc-400">
        {copied ? 'Copied!' : 'Copy'}
      </span>
    </button>
  );
}
