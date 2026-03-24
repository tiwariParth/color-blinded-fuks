'use client';

import { useGameStore } from '@/hooks/useGameState';
import { useSocket } from '@/hooks/useSocket';
import { useRouter } from 'next/navigation';

export function GameOver() {
  const router = useRouter();
  const { requestRematch } = useSocket();
  const { players, winnerId, scores, cumulativeScores, roundNumber, reset } = useGameStore();

  const winner = players.find((p) => p.id === winnerId);

  const sortedPlayers = [...players].sort((a, b) => {
    // Sort by cumulative score ascending (lower = better)
    return (cumulativeScores[a.id] ?? 0) - (cumulativeScores[b.id] ?? 0);
  });

  const handleBackToHome = () => {
    reset();
    router.push('/');
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-5xl">🏆</p>
          <h2 className="text-3xl font-bold text-white">
            {winner?.name || 'Someone'} wins!
          </h2>
          {roundNumber > 1 && (
            <p className="text-sm text-zinc-400">Round {roundNumber}</p>
          )}
        </div>

        {/* Scoreboard */}
        <div className="space-y-2 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Scoreboard
          </h3>
          {/* Header */}
          <div className="flex items-center justify-between px-3 pb-1 text-xs text-zinc-500">
            <span>Player</span>
            <div className="flex gap-6">
              <span className="w-16 text-right">Round</span>
              <span className="w-16 text-right font-semibold text-zinc-400">Total</span>
            </div>
          </div>
          {sortedPlayers.map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                player.id === winnerId
                  ? 'bg-yellow-500/10 text-yellow-400'
                  : 'text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono w-5">{i + 1}.</span>
                <span className="font-medium">{player.name}</span>
                {player.id === winnerId && (
                  <span className="text-xs">👑</span>
                )}
              </div>
              <div className="flex gap-6">
                <span className="w-16 text-right text-sm text-zinc-500">
                  +{scores?.[player.id] ?? 0}
                </span>
                <span className="w-16 text-right text-sm font-semibold">
                  {cumulativeScores[player.id] ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-500">
          Lower score is better — penalty points for cards left in hand
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={requestRematch}
            className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-500"
          >
            Rematch
          </button>
          <button
            onClick={handleBackToHome}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-3 font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
