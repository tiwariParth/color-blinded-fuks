'use client';

import { useMemo, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameState';
import { useSocket } from '@/hooks/useSocket';
import { CardHand } from '@/components/cards/CardHand';
import { PlayerSeat } from '@/components/game/PlayerSeat';
import { DiscardPile } from '@/components/game/DiscardPile';
import { DrawPile } from '@/components/game/DrawPile';
import { ColorPicker } from '@/components/game/ColorPicker';
import { UnoButton } from '@/components/game/UnoButton';
import { GameLog } from '@/components/game/GameLog';
import type { CardColor, UnoCard } from '@/lib/types';

const GLOW_MAP: Record<string, string> = {
  red: 'rgba(224,58,42,0.12)',
  yellow: 'rgba(245,200,0,0.10)',
  green: 'rgba(61,170,79,0.12)',
  blue: 'rgba(42,109,181,0.12)',
  wild: 'rgba(200,200,200,0.06)',
};

export function GameBoard() {
  const { socket, forceStop } = useSocket();
  const { gameState, myHand, playerId, hostId } = useGameStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);

  const isMyTurn = useMemo(() => {
    if (!gameState || !playerId) return false;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentPlayer?.id === playerId;
  }, [gameState, playerId]);

  const topDiscard = useMemo(() => {
    if (!gameState || gameState.discardPile.length === 0) return null;
    return gameState.discardPile[gameState.discardPile.length - 1];
  }, [gameState]);

  const playableCardIds = useMemo(() => {
    const ids = new Set<string>();
    if (!isMyTurn || !gameState || !topDiscard) return ids;
    if (gameState.phase === 'color_pick') return ids;
    for (const card of myHand) {
      if (isCardPlayable(card, topDiscard, gameState.currentColor, gameState.pendingDrawCount, gameState.settings.variants)) {
        ids.add(card.id);
      }
    }
    return ids;
  }, [isMyTurn, myHand, topDiscard, gameState]);

  const opponents = useMemo(() => {
    if (!gameState) return [];
    return gameState.players.filter((p) => p.id !== playerId);
  }, [gameState, playerId]);

  const me = useMemo(() => {
    if (!gameState || !playerId) return null;
    return gameState.players.find((p) => p.id === playerId) ?? null;
  }, [gameState, playerId]);

  const showUnoButton = useMemo(() => {
    if (!me || !gameState || gameState.phase !== 'playing') return false;
    return myHand.length <= 2 && myHand.length > 0 && !me.saidUno;
  }, [me, myHand, gameState]);

  const catchableOpponents = useMemo(() => {
    if (!gameState || gameState.phase !== 'playing') return new Set<string>();
    const ids = new Set<string>();
    for (const p of opponents) {
      if (p.handSize === 1 && !p.saidUno) ids.add(p.id);
    }
    return ids;
  }, [opponents, gameState]);

  const handlePlayCard = useCallback(
    (cardId: string) => {
      const card = myHand.find((c) => c.id === cardId);
      if (!card) return;
      if (card.isWild) {
        setPendingWildCardId(cardId);
        setShowColorPicker(true);
        return;
      }
      socket.emit('PLAY_CARD', { cardId });
    },
    [socket, myHand]
  );

  const handleChooseColor = useCallback(
    (color: CardColor) => {
      setShowColorPicker(false);
      if (pendingWildCardId) {
        socket.emit('PLAY_CARD', { cardId: pendingWildCardId, chosenColor: color });
        setPendingWildCardId(null);
      }
    },
    [socket, pendingWildCardId]
  );

  const handleDraw = useCallback(() => { socket.emit('DRAW_CARD'); }, [socket]);
  const handleSayUno = useCallback(() => { socket.emit('SAY_UNO'); }, [socket]);
  const handleCatchUno = useCallback(
    (targetPlayerId: string) => { socket.emit('CHALLENGE_UNO', { targetPlayerId }); },
    [socket]
  );
  const handleSwapTarget = useCallback(
    (targetPlayerId: string) => { socket.emit('CHOOSE_SWAP_TARGET', { targetPlayerId }); },
    [socket]
  );

  const showSwapPicker = useMemo(() => {
    if (!gameState || !playerId) return false;
    return (gameState.phase as string) === 'swap_pick' && isMyTurn;
  }, [gameState, playerId, isMyTurn]);

  const isHost = playerId === hostId;

  if (!gameState) return null;

  const canDraw = isMyTurn && gameState.phase === 'playing';
  const ambientColor = GLOW_MAP[gameState.currentColor] || GLOW_MAP.wild;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 h-8 sm:h-10">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`rounded-lg bg-red-600/20 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-red-400 transition-opacity ${gameState.pendingDrawCount > 0 ? 'opacity-100' : 'opacity-0'}`}>
            +{gameState.pendingDrawCount}
          </span>
          <span className={`rounded-lg bg-zinc-800/60 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs text-zinc-500 transition-opacity ${gameState.direction === -1 ? 'opacity-100' : 'opacity-0'}`}>
            Rev
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <GameLog logs={gameState.logs ?? []} />
          {isHost && (
            <button
              onClick={forceStop}
              className="rounded-lg border border-red-900/60 bg-red-950/30 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-red-400/80 transition-colors hover:bg-red-950/60 hover:text-red-300"
            >
              End
            </button>
          )}
        </div>
      </div>

      {/* ── Opponents ── */}
      <div className="flex items-start justify-center gap-2 sm:gap-4 px-2 sm:px-4 py-1 sm:py-2 flex-wrap">
        {opponents.map((player) => (
          <PlayerSeat
            key={player.id}
            player={player}
            isCurrentTurn={gameState.players[gameState.currentPlayerIndex]?.id === player.id}
            isYou={false}
            canCatch={catchableOpponents.has(player.id)}
            onCatch={() => handleCatchUno(player.id)}
          />
        ))}
      </div>

      {/* ── Table surface ── */}
      <div
        className="felt-bg relative mx-1.5 sm:mx-3 flex flex-1 items-center justify-center gap-4 sm:gap-12 rounded-xl sm:rounded-2xl"
        style={{
          boxShadow: `inset 0 0 80px 20px rgba(0,0,0,0.3), 0 0 80px ${ambientColor}`,
        }}
      >
        {/* Ambient color glow under table */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-all duration-700"
          style={{
            background: `radial-gradient(ellipse at 55% 50%, ${ambientColor} 0%, transparent 60%)`,
          }}
        />

        <DrawPile deckSize={gameState.deckSize} canDraw={canDraw} onDraw={handleDraw} />
        <DiscardPile topCard={topDiscard} currentColor={gameState.currentColor} />
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-10">
        <span className="truncate text-[10px] sm:text-xs text-zinc-500">
          {gameState.lastAction || '\u00A0'}
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span
            className={`rounded-full bg-yellow-500/15 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-yellow-400 transition-opacity duration-200 ${
              isMyTurn && gameState.phase === 'playing' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Your turn
          </span>
          <AnimatePresence>
            {showUnoButton && <UnoButton onClick={handleSayUno} />}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Your hand ── */}
      <div className="relative border-t border-zinc-800/60 bg-gradient-to-t from-zinc-950 via-zinc-900/95 to-transparent px-0.5 sm:px-2">
        <CardHand
          cards={myHand}
          playableCardIds={playableCardIds}
          onPlayCard={handlePlayCard}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* Color picker */}
      <AnimatePresence>
        {showColorPicker && <ColorPicker onChoose={handleChooseColor} />}
      </AnimatePresence>

      {/* Swap picker for Trade Hands */}
      {showSwapPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-3 sm:mx-4 w-full max-w-[92vw] sm:max-w-sm rounded-xl sm:rounded-2xl border border-purple-500/30 bg-zinc-900/95 p-4 sm:p-6 shadow-2xl">
            <h3 className="mb-1 text-center text-base sm:text-lg font-bold text-purple-300">Trade Hands</h3>
            <p className="mb-3 sm:mb-4 text-center text-[10px] sm:text-xs text-zinc-400">Pick a player to swap hands with</p>
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {opponents.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleSwapTarget(player.id)}
                  className="flex items-center justify-between rounded-lg sm:rounded-xl border border-zinc-700/60 bg-zinc-800/80 px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-zinc-200 transition-colors hover:border-purple-500/50 hover:bg-purple-950/40"
                >
                  <span className="font-medium">{player.name}</span>
                  <span className="rounded-full bg-zinc-700/60 px-2 py-0.5 text-[10px] sm:text-xs text-zinc-400">
                    {player.handSize} cards
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isCardPlayable(
  card: UnoCard,
  topDiscard: UnoCard,
  currentColor: CardColor,
  pendingDrawCount: number,
  variants: { stacking: boolean }
): boolean {
  if (pendingDrawCount > 0) {
    if (!variants.stacking) return false;
    if (topDiscard.value === 'draw2' && card.value === 'draw2') return true;
    if (topDiscard.value === 'wild_draw4' && card.value === 'wild_draw4') return true;
    return false;
  }
  if (card.isWild) return true;
  if (card.color === currentColor) return true;
  if (card.value === topDiscard.value) return true;
  return false;
}
