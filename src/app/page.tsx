'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/hooks/useGameState';

const FLOATING_CARDS = [
  { color: '#E03A2A', value: '7', x: '8%',  y: '15%', rotate: -18, delay: 0 },
  { color: '#F5C800', value: '3', x: '85%', y: '20%', rotate: 12,  delay: 0.3 },
  { color: '#3DAA4F', value: '+2', x: '12%', y: '75%', rotate: 22,  delay: 0.6 },
  { color: '#2A6DB5', value: '9', x: '88%', y: '70%', rotate: -15, delay: 0.9 },
  { color: '#E03A2A', value: 'R', x: '5%',  y: '45%', rotate: 35,  delay: 0.2 },
  { color: '#3DAA4F', value: '0', x: '92%', y: '45%', rotate: -28, delay: 0.5 },
];

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
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
      {/* Ambient radial gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(224,58,42,0.08) 0%, rgba(245,200,0,0.04) 30%, transparent 70%)',
        }}
      />

      {/* Floating decorative cards */}
      {FLOATING_CARDS.map((card, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute hidden md:block"
          style={{ left: card.x, top: card.y }}
          initial={{ opacity: 0, y: 30, rotate: card.rotate - 10 }}
          animate={{
            opacity: 0.12,
            y: [0, -8, 0],
            rotate: card.rotate,
          }}
          transition={{
            opacity: { delay: card.delay, duration: 0.8 },
            y: { delay: card.delay, duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' },
            rotate: { delay: card.delay, duration: 0.8 },
          }}
        >
          <svg width="56" height="80" viewBox="0 0 70 100">
            <rect width="70" height="100" rx="8" fill={card.color} />
            <ellipse cx="35" cy="50" rx="22" ry="32" fill="rgba(255,255,255,0.9)" transform="rotate(-15,35,50)" />
            <text x="35" y="56" textAnchor="middle" dominantBaseline="middle" fontSize="26" fontWeight="bold" fill={card.color} fontFamily="Arial">{card.value}</text>
          </svg>
        </motion.div>
      ))}

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* UNO Logo */}
        <div className="mb-10 text-center">
          <h1
            className="text-7xl font-black tracking-tight"
            style={{
              textShadow: '0 0 60px rgba(224,58,42,0.3), 0 0 120px rgba(245,200,0,0.15)',
            }}
          >
            <span style={{ color: 'var(--uno-red)' }}>U</span>
            <span style={{ color: 'var(--uno-yellow)' }}>N</span>
            <span style={{ color: 'var(--uno-green)' }}>O</span>
          </h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">
            play with friends
          </p>
        </div>

        {/* Name */}
        <div className="mb-5">
          <input
            id="name"
            type="text"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3.5 text-center text-white placeholder-zinc-600 outline-none backdrop-blur-sm transition-all focus:border-zinc-600 focus:bg-zinc-900"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-950/40 px-4 py-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Create */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || mode === 'create'}
          className="group relative mb-4 w-full overflow-hidden rounded-xl py-3.5 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #E03A2A 0%, #c0281a 100%)',
          }}
        >
          <span className="relative z-10">{mode === 'create' ? 'Creating...' : 'Create Room'}</span>
          <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10" />
        </button>

        {/* Divider */}
        <div className="relative mb-4 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
          <span className="text-xs font-medium text-zinc-600">or join</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
        </div>

        {/* Join */}
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            className="w-32 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-3.5 text-center font-mono text-lg tracking-[0.2em] text-white placeholder-zinc-700 outline-none backdrop-blur-sm transition-all focus:border-zinc-600"
          />
          <button
            onClick={handleJoin}
            disabled={!name.trim() || !joinCode.trim() || mode === 'join'}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/80 py-3.5 font-bold text-white transition-all hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === 'join' ? 'Joining...' : 'Join'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
