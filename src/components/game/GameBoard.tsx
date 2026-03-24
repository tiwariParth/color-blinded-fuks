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
import type { CardColor, UnoCard } from '@/lib/types';

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

  // Show UNO button when player has 1-2 cards and hasn't said UNO yet
  const showUnoButton = useMemo(() => {
    if (!me || !gameState || gameState.phase !== 'playing') return false;
    return myHand.length <= 2 && myHand.length > 0 && !me.saidUno;
  }, [me, myHand, gameState]);

  // Opponents who can be caught (1 card, didn't say UNO)
  const catchableOpponents = useMemo(() => {
    if (!gameState || gameState.phase !== 'playing') return new Set<string>();
    const ids = new Set<string>();
    for (const p of opponents) {
      if (p.handSize === 1 && !p.saidUno) {
        ids.add(p.id);
      }
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

  const handleDraw = useCallback(() => {
    socket.emit('DRAW_CARD');
  }, [socket]);

  const handlePass = useCallback(() => {
    socket.emit('PASS_TURN');
  }, [socket]);

  const handleSayUno = useCallback(() => {
    socket.emit('SAY_UNO');
  }, [socket]);

  const handleCatchUno = useCallback(
    (targetPlayerId: string) => {
      socket.emit('CHALLENGE_UNO', { targetPlayerId });
    },
    [socket]
  );

  const isHost = playerId === hostId;

  if (!gameState) return null;

  const canDraw = isMyTurn && gameState.phase === 'playing';

  return (
    <div className="flex flex-1 flex-col">
      {/* Top bar with force stop */}
      {isHost && (
        <div className="flex justify-end px-3 pt-2">
          <button
            onClick={forceStop}
            className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/50"
          >
            End Match
          </button>
        </div>
      )}

      {/* Opponents row */}
      <div className="flex items-start justify-center gap-3 p-3 flex-wrap">
        {opponents.map((player) => (
          <PlayerSeat
            key={player.id}
            player={player}
            isCurrentTurn={
              gameState.players[gameState.currentPlayerIndex]?.id === player.id
            }
            isYou={false}
            canCatch={catchableOpponents.has(player.id)}
            onCatch={() => handleCatchUno(player.id)}
          />
        ))}
      </div>

      {/* Center: draw pile + discard pile + game info */}
      <div className="flex flex-1 items-center justify-center gap-8">
        <DrawPile deckSize={gameState.deckSize} canDraw={canDraw} onDraw={handleDraw} />
        <DiscardPile topCard={topDiscard} currentColor={gameState.currentColor} />
      </div>

      {/* Game info bar */}
      <div className="flex items-center justify-center gap-4 py-2">
        {gameState.lastAction && (
          <span className="text-sm text-zinc-400">{gameState.lastAction}</span>
        )}
        {isMyTurn && gameState.phase === 'playing' && (
          <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm font-medium text-yellow-400">
            Your turn!
          </span>
        )}
        {isMyTurn && gameState.phase === 'playing' && (
          <button
            onClick={handlePass}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            Pass
          </button>
        )}
        <AnimatePresence>
          {showUnoButton && (
            <UnoButton onClick={handleSayUno} />
          )}
        </AnimatePresence>
      </div>

      {/* Your hand */}
      <div className="border-t border-zinc-800 bg-zinc-900/80 px-4">
        <CardHand
          cards={myHand}
          playableCardIds={playableCardIds}
          onPlayCard={handlePlayCard}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* Color picker modal */}
      <AnimatePresence>
        {showColorPicker && <ColorPicker onChoose={handleChooseColor} />}
      </AnimatePresence>
    </div>
  );
}

// Client-side version of canPlayCard (matches server rules)
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
