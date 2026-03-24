'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/hooks/useGameState';

export default function Home() {
  const router = useRouter();
  const { createRoom, joinRoom } = useSocket();
  const { roomCode, error } = useGameStore();

  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'idle' | 'create' | 'join'>('idle');

  useEffect(() => {
    if (roomCode) {
      router.push(`/room/${roomCode}`);
    }
  }, [roomCode, router]);

  const handleCreate = () => {
    if (!name.trim()) return;
    setMode('create');
    createRoom(name.trim());
  };

  const handleJoin = () => {
    if (!name.trim() || !joinCode.trim()) return;
    setMode('join');
    joinRoom(joinCode.trim(), name.trim());
  };

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-6xl font-black tracking-tighter">
            <span className="text-red-500">U</span>
            <span className="text-yellow-400">N</span>
            <span className="text-green-500">O</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">Online Multiplayer</p>
        </div>

        {/* Name input */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Your Name
          </label>
          <input
            id="name"
            type="text"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your display name"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Create Room */}
        <div className="space-y-3">
          <button
            onClick={handleCreate}
            disabled={!name.trim() || mode === 'create'}
            className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === 'create' ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-zinc-900 px-4 text-zinc-500">or</span>
          </div>
        </div>

        {/* Join Room */}
        <div className="space-y-3">
          <input
            type="text"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-center text-lg font-mono tracking-widest text-white placeholder-zinc-500 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          />
          <button
            onClick={handleJoin}
            disabled={!name.trim() || !joinCode.trim() || mode === 'join'}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-3 font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === 'join' ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
}
