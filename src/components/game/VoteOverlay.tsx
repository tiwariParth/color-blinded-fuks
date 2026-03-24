'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '@/lib/socket/client';
import { useGameStore } from '@/hooks/useGameState';

interface VoteState {
  active: boolean;
  initiator: string;
  yes: number;
  no: number;
  total: number;
  endsAt: number;
  result: 'pending' | 'passed' | 'rejected';
}

export function VoteOverlay() {
  const socket = getSocket();
  const playerId = useGameStore((s) => s.playerId);

  const [vote, setVote] = useState<VoteState>({
    active: false,
    initiator: '',
    yes: 0,
    no: 0,
    total: 0,
    endsAt: 0,
    result: 'pending',
  });
  const [hasVoted, setHasVoted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const onStarted = ({ initiator, endsAt }: { initiator: string; endsAt: number }) => {
      setVote({ active: true, initiator, yes: 0, no: 0, total: 0, endsAt, result: 'pending' });
      setHasVoted(false);
      setTimeLeft(Math.max(0, endsAt - Date.now()));
    };

    const onUpdate = ({ yes, no, total, endsAt }: { yes: number; no: number; total: number; endsAt: number }) => {
      setVote((prev) => ({ ...prev, yes, no, total, endsAt }));
    };

    const onResult = ({ passed }: { passed: boolean }) => {
      setVote((prev) => ({ ...prev, result: passed ? 'passed' : 'rejected' }));
      // Auto-dismiss after 1.5s
      setTimeout(() => {
        setVote((prev) => ({ ...prev, active: false }));
      }, 1500);
    };

    socket.on('FORCE_STOP_VOTE_STARTED', onStarted);
    socket.on('FORCE_STOP_VOTE_UPDATE', onUpdate);
    socket.on('FORCE_STOP_VOTE_RESULT', onResult);

    return () => {
      socket.off('FORCE_STOP_VOTE_STARTED', onStarted);
      socket.off('FORCE_STOP_VOTE_UPDATE', onUpdate);
      socket.off('FORCE_STOP_VOTE_RESULT', onResult);
    };
  }, [socket]);

  // Countdown timer
  useEffect(() => {
    if (!vote.active || vote.result !== 'pending') return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, vote.endsAt - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [vote.active, vote.endsAt, vote.result]);

  const castVote = useCallback(
    (yes: boolean) => {
      if (hasVoted) return;
      setHasVoted(true);
      socket.emit('FORCE_STOP_VOTE', { vote: yes });
    },
    [socket, hasVoted]
  );

  // Host auto-voted yes
  const isInitiator = vote.initiator === (useGameStore.getState().players.find((p) => p.id === playerId)?.name);

  const progress = vote.endsAt > 0 ? Math.max(0, Math.min(1, timeLeft / 10_000)) : 0;

  return (
    <AnimatePresence>
      {vote.active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-80 rounded-2xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
          >
            {vote.result === 'pending' ? (
              <>
                <h3 className="text-center text-lg font-bold text-white">End Match?</h3>
                <p className="mt-1 text-center text-sm text-zinc-400">
                  <span className="font-medium text-zinc-200">{vote.initiator}</span> wants to end the match
                </p>

                {/* Timer progress bar */}
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <motion.div
                    className="h-full rounded-full bg-yellow-500"
                    style={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.05 }}
                  />
                </div>
                <p className="mt-1 text-center text-xs text-zinc-500">
                  {Math.ceil(timeLeft / 1000)}s remaining
                </p>

                {/* Vote counts */}
                <div className="mt-3 flex justify-center gap-6 text-sm">
                  <span className="text-green-400">Yes: {vote.yes}</span>
                  <span className="text-red-400">No: {vote.no}</span>
                  <span className="text-zinc-500">{vote.yes + vote.no}/{vote.total}</span>
                </div>

                {/* Vote buttons */}
                {!hasVoted && !isInitiator ? (
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => castVote(true)}
                      className="flex-1 rounded-lg bg-green-600 py-2.5 font-semibold text-white transition-colors hover:bg-green-500"
                    >
                      Yes, end it
                    </button>
                    <button
                      onClick={() => castVote(false)}
                      className="flex-1 rounded-lg bg-red-600 py-2.5 font-semibold text-white transition-colors hover:bg-red-500"
                    >
                      No, keep playing
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-center text-sm text-zinc-500">
                    {isInitiator ? 'Waiting for others to vote...' : 'Vote submitted, waiting...'}
                  </p>
                )}
              </>
            ) : (
              <div className="py-4 text-center">
                <p className="text-2xl">{vote.result === 'passed' ? '✓' : '✗'}</p>
                <p className="mt-2 text-lg font-bold text-white">
                  {vote.result === 'passed' ? 'Match ended' : 'Vote failed — keep playing!'}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
