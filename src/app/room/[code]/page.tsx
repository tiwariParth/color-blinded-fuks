'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/hooks/useGameState';
import { useSocket } from '@/hooks/useSocket';
import { LobbyRoom } from '@/components/lobby/LobbyRoom';
import { GameBoard } from '@/components/game/GameBoard';
import { GameOver } from '@/components/game/GameOver';
import { ChatBox } from '@/components/game/ChatBox';
import { VoteOverlay } from '@/components/game/VoteOverlay';

export default function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { roomCode, phase } = useGameStore();
  useSocket();

  useEffect(() => {
    if (!roomCode) {
      router.replace('/');
    }
  }, [roomCode, router]);

  if (!roomCode) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Redirecting...</p>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <>
        <LobbyRoom />
        <ChatBox />
      </>
    );
  }

  if (phase === 'finished') {
    return (
      <>
        <GameOver />
        <ChatBox />
      </>
    );
  }

  // playing or color_pick
  return (
    <>
      <GameBoard />
      <ChatBox />
      <VoteOverlay />
    </>
  );
}
