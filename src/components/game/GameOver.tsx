'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameState';
import { useSocket } from '@/hooks/useSocket';
import { useRouter } from 'next/navigation';

export function GameOver() {
  const router = useRouter();
  const { requestRematch } = useSocket();
  const { players, winnerId, scores, cumulativeScores, roundNumber, reset } = useGameStore();

  const winner = players.find((p) => p.id === winnerId);

  const sortedPlayers = [...players].sort((a, b) => {
    return (cumulativeScores[a.id] ?? 0) - (cumulativeScores[b.id] ?? 0);
  });

  const handleBackToHome = () => {
    reset();
    router.push('/');
  };

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      {/* Ambient winner glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(245,200,0,0.08) 0%, transparent 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm space-y-6 text-center"
      >
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
        >
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,0,0.15) 0%, rgba(245,200,0,0.05) 100%)',
              boxShadow: '0 0 40px rgba(245,200,0,0.15)',
            }}
          >
            <span>&#127942;</span>
          </div>
        </motion.div>

        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            {winner?.name || 'Someone'} wins!
          </motion.h2>
          {roundNumber > 1 && (
            <p className="mt-1 text-xs text-zinc-500">Round {roundNumber}</p>
          )}
        </div>

        {/* Scoreboard */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 pb-2 text-[10px] uppercase tracking-wider text-zinc-600">
            <span>Player</span>
            <div className="flex gap-6">
              <span className="w-12 text-right">Round</span>
              <span className="w-12 text-right">Total</span>
            </div>
          </div>

          <div className="space-y-1">
            {sortedPlayers.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className={`flex items-center justify-between rounded-lg px-2 py-2 ${
                  player.id === winnerId
                    ? 'bg-yellow-500/8'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs ${player.id === winnerId ? 'text-yellow-400' : 'text-zinc-600'}`}>
                    {i + 1}
                  </span>
                  <span className={`text-sm font-medium ${player.id === winnerId ? 'text-yellow-400' : 'text-zinc-300'}`}>
                    {player.name}
                  </span>
                </div>
                <div className="flex gap-6">
                  <span className="w-12 text-right text-xs text-zinc-600">
                    +{scores?.[player.id] ?? 0}
                  </span>
                  <span className={`w-12 text-right text-xs font-semibold ${player.id === winnerId ? 'text-yellow-400' : 'text-zinc-300'}`}>
                    {cumulativeScores[player.id] ?? 0}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p className="text-[10px] text-zinc-600">
          Lower score is better &#8212; penalty for cards left in hand
        </p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3"
        >
          <button
            onClick={requestRematch}
            className="group relative flex-1 overflow-hidden rounded-xl py-3.5 font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #3DAA4F 0%, #2a8a38 100%)' }}
          >
            <span className="relative z-10">Rematch</span>
            <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10" />
          </button>
          <button
            onClick={handleBackToHome}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3.5 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-400"
          >
            Leave
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
