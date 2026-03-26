import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  CardColor,
  LogEntryType,
  GameState,
} from '@/lib/types';

function pushLog(state: GameState, type: LogEntryType, message: string) {
  state.logs.push({ id: crypto.randomUUID(), timestamp: Date.now(), type, message });
  if (state.logs.length > 100) state.logs.shift();
}

function cardLabel(card: { value: string; color: string; isWild: boolean }, chosenColor?: string): string {
  if (card.value === 'wild') return `Wild (→ ${chosenColor || '?'})`;
  if (card.value === 'wild_draw4') return `Wild +4 (→ ${chosenColor || '?'})`;
  const c = card.color.charAt(0).toUpperCase() + card.color.slice(1);
  const v = card.value === 'draw2' ? '+2' : card.value === 'skip' ? 'Skip' : card.value === 'reverse' ? 'Reverse' : card.value;
  return `${c} ${v}`;
}

function cardLogType(card: { value: string; isWild: boolean }): LogEntryType {
  if (card.isWild) return 'wild';
  if (card.value === 'skip' || card.value === 'reverse') return 'skip';
  if (card.value === 'draw2') return 'draw';
  return 'play';
}
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomCodeBySocketId,
  updateSettings,
  toClientPlayer,
  getRoom,
  startGame,
  rematchGame,
  forceStopGame,
} from '@/lib/game/roomManager';
import { canPlayCard, applyCardEffect, drawCards, checkWinCondition, nextPlayerIndex } from '@/lib/game/rules';
import { toClientState } from '@/lib/game/sanitize';
import { chooseBotCard, chooseBotColor, getBotDelay, shouldBotSayUno } from '@/lib/game/bots';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

type ColorPickGameState = ReturnType<typeof getRoom> & {
  _pendingWildCardId?: string;
};

// Track bot turn timeouts so we can cancel them if needed
const botTimers = new Map<string, NodeJS.Timeout>();

// Track active force-stop votes
interface ForceStopVote {
  initiator: string;
  votes: Map<string, boolean>; // playerId → yes/no
  totalHumans: number;
  endsAt: number;
  timer: NodeJS.Timeout;
}
const activeVotes = new Map<string, ForceStopVote>();

// ── Helpers ─────────────────────────────────────────────────────────────────

function emitLobbyUpdate(io: IO, roomCode: string) {
  const state = getRoom(roomCode);
  if (!state) return;

  io.to(roomCode).emit('LOBBY_UPDATE', {
    players: state.players.map(toClientPlayer),
    settings: state.settings,
    hostId: state.hostId,
  });
}

function emitGameStateToAll(io: IO, roomCode: string) {
  const state = getRoom(roomCode);
  if (!state) return;

  for (const player of state.players) {
    if (player.type === 'bot') continue;
    const clientState = toClientState(state, player.id);
    io.to(player.id).emit('GAME_STATE_UPDATE', { state: clientState });
  }

  // Notify current player it's their turn (human only)
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer && currentPlayer.type === 'human') {
    io.to(currentPlayer.id).emit('YOUR_TURN', {
      timeLimit: state.settings.turnTimerSeconds ?? undefined,
    });
  }
}

function checkAndHandleWin(io: IO, roomCode: string, playerIndex: number): boolean {
  const state = getRoom(roomCode);
  if (!state) return false;

  if (checkWinCondition(state, playerIndex)) {
    state.phase = 'finished';
    state.winner = state.players[playerIndex].id;

    // Calculate round scores (penalty points for cards left in hand)
    const roundScores: Record<string, number> = {};
    for (const p of state.players) {
      let total = 0;
      for (const card of p.hand) {
        if (card.value === 'wild' || card.value === 'wild_draw4') total += 50;
        else if (card.value === 'skip' || card.value === 'reverse' || card.value === 'draw2') total += 20;
        else total += parseInt(card.value) || 0;
      }
      roundScores[p.id] = total;
    }

    // Accumulate into cumulative scores
    for (const p of state.players) {
      state.cumulativeScores[p.id] = (state.cumulativeScores[p.id] || 0) + roundScores[p.id];
    }

    // Cancel any pending bot timer
    cancelBotTimer(roomCode);

    io.to(roomCode).emit('GAME_OVER', {
      winnerId: state.players[playerIndex].id,
      scores: roundScores,
    });

    emitGameStateToAll(io, roomCode);
    return true;
  }
  return false;
}

// ── Bot Turn System ─────────────────────────────────────────────────────────

function cancelBotTimer(roomCode: string) {
  const timer = botTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    botTimers.delete(roomCode);
  }
}

function resolveVote(io: IO, roomCode: string) {
  const voteState = activeVotes.get(roomCode);
  if (!voteState) return;
  activeVotes.delete(roomCode);

  let yes = 0, no = 0;
  for (const v of voteState.votes.values()) {
    if (v) yes++; else no++;
  }

  // Non-voters count as "no"
  const passed = yes > voteState.totalHumans / 2;

  io.to(roomCode).emit('FORCE_STOP_VOTE_RESULT', { passed });

  if (passed) {
    const { state, error } = forceStopGame(roomCode, voteState.initiator);
    if (!error && state) {
      cancelBotTimer(roomCode);
      io.to(roomCode).emit('FORCE_STOPPED');
      emitLobbyUpdate(io, roomCode);
    }
  }
}

function scheduleBotTurnIfNeeded(io: IO, roomCode: string) {
  const state = getRoom(roomCode);
  if (!state || state.phase !== 'playing') return;

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.type !== 'bot') return;

  const delay = getBotDelay(currentPlayer.difficulty || 'medium');

  cancelBotTimer(roomCode);

  const timer = setTimeout(() => {
    botTimers.delete(roomCode);
    executeBotTurn(io, roomCode);
  }, delay);

  botTimers.set(roomCode, timer);
}

function executeBotTurn(io: IO, roomCode: string) {
  const state = getRoom(roomCode);
  if (!state || state.phase !== 'playing') return;

  const botIndex = state.currentPlayerIndex;
  const bot = state.players[botIndex];
  if (!bot || bot.type !== 'bot') return;

  const difficulty = bot.difficulty || 'medium';

  // Handle pending draw (stacking)
  if (state.pendingDrawCount > 0) {
    // Try to stack if possible
    const card = chooseBotCard(state, bot);
    if (card) {
      // Bot can stack
      const cardIndex = bot.hand.findIndex((c) => c.id === card.id);
      bot.hand.splice(cardIndex, 1);

      if (bot.hand.length === 0) {
        const cc = card.isWild ? chooseBotColor(bot, difficulty) : undefined;
        state.discardPile.push(card);
        state.currentColor = cc ?? card.color;
        state.lastAction = `${bot.name} played their last card!`;
        pushLog(state, cardLogType(card), `${bot.name} played ${cardLabel(card, cc)} — UNO OUT!`);
        checkAndHandleWin(io, roomCode, botIndex);
        return;
      }

      const chosenColor = card.isWild ? chooseBotColor(bot, difficulty) : undefined;
      applyCardEffect(state, card, chosenColor);
      state.lastAction = `${bot.name} played ${card.color} ${card.value}`;
      pushLog(state, cardLogType(card), `${bot.name} played ${cardLabel(card, chosenColor)}`);

      // Bot says UNO if down to 1 card
      if (bot.hand.length === 1 && shouldBotSayUno(difficulty)) {
        bot.saidUno = true;
        io.to(roomCode).emit('UNO_CALLED', { playerId: bot.id });
        pushLog(state, 'uno', `${bot.name} called UNO!`);
      }
    } else {
      // Bot must draw the pending amount
      drawCards(state, botIndex, state.pendingDrawCount);
      state.lastAction = `${bot.name} drew ${state.pendingDrawCount} cards`;
      pushLog(state, 'draw', `${bot.name} drew ${state.pendingDrawCount} cards (forced)`);
      state.pendingDrawCount = 0;
      state.currentPlayerIndex = nextPlayerIndex(botIndex, state.direction, state.players.length);
    }

    state.turnStartTime = Date.now();
    emitGameStateToAll(io, roomCode);
    scheduleBotTurnIfNeeded(io, roomCode);
    return;
  }

  // Normal turn: try to play a card
  const card = chooseBotCard(state, bot);

  if (card) {
    const cardIndex = bot.hand.findIndex((c) => c.id === card.id);
    bot.hand.splice(cardIndex, 1);

    // Check win
    if (bot.hand.length === 0) {
      const cc = card.isWild ? chooseBotColor(bot, difficulty) : undefined;
      state.discardPile.push(card);
      state.currentColor = cc ?? card.color;
      state.lastAction = `${bot.name} played their last card!`;
      pushLog(state, cardLogType(card), `${bot.name} played ${cardLabel(card, cc)} — UNO OUT!`);
      checkAndHandleWin(io, roomCode, botIndex);
      return;
    }

    const chosenColor = card.isWild ? chooseBotColor(bot, difficulty) : undefined;
    applyCardEffect(state, card, chosenColor);
    state.lastAction = `${bot.name} played ${card.color === 'wild' ? '' : card.color} ${card.value}`;
    pushLog(state, cardLogType(card), `${bot.name} played ${cardLabel(card, chosenColor)}`);

    // Bot says UNO if down to 1 card
    if (bot.hand.length === 1 && shouldBotSayUno(difficulty)) {
      bot.saidUno = true;
      io.to(roomCode).emit('UNO_CALLED', { playerId: bot.id });
      pushLog(state, 'uno', `${bot.name} called UNO!`);
    }
  } else {
    // No playable card — draw one
    drawCards(state, botIndex, 1);
    const drawnCard = bot.hand[bot.hand.length - 1];
    const topDiscard = state.discardPile[state.discardPile.length - 1];
    pushLog(state, 'draw', `${bot.name} drew a card`);

    if (drawnCard && canPlayCard(drawnCard, topDiscard, state.currentColor, 0, state.settings.variants)) {
      // Play the drawn card
      const drawnIndex = bot.hand.findIndex((c) => c.id === drawnCard.id);
      bot.hand.splice(drawnIndex, 1);

      if (bot.hand.length === 0) {
        const cc = drawnCard.isWild ? chooseBotColor(bot, difficulty) : undefined;
        state.discardPile.push(drawnCard);
        state.currentColor = cc ?? drawnCard.color;
        state.lastAction = `${bot.name} drew and played their last card!`;
        pushLog(state, cardLogType(drawnCard), `${bot.name} drew & played ${cardLabel(drawnCard, cc)} — UNO OUT!`);
        checkAndHandleWin(io, roomCode, botIndex);
        return;
      }

      const chosenColor = drawnCard.isWild ? chooseBotColor(bot, difficulty) : undefined;
      applyCardEffect(state, drawnCard, chosenColor);
      state.lastAction = `${bot.name} drew and played ${drawnCard.color === 'wild' ? '' : drawnCard.color} ${drawnCard.value}`;
      pushLog(state, cardLogType(drawnCard), `${bot.name} drew & played ${cardLabel(drawnCard, chosenColor)}`);

      // Bot says UNO if down to 1 card
      if (bot.hand.length === 1 && shouldBotSayUno(difficulty)) {
        bot.saidUno = true;
        io.to(roomCode).emit('UNO_CALLED', { playerId: bot.id });
        pushLog(state, 'uno', `${bot.name} called UNO!`);
      }
    } else {
      // Can't play drawn card — pass
      state.currentPlayerIndex = nextPlayerIndex(botIndex, state.direction, state.players.length);
      state.lastAction = `${bot.name} drew a card and passed`;
      pushLog(state, 'draw', `${bot.name} couldn't play — turn skipped`);
    }
  }

  state.turnStartTime = Date.now();
  emitGameStateToAll(io, roomCode);
  scheduleBotTurnIfNeeded(io, roomCode);
}

// ── Socket Handlers ─────────────────────────────────────────────────────────

export function setupSocketHandlers(io: IO) {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ── Lobby Events ──────────────────────────────────────────────────

    socket.on('CREATE_ROOM', ({ playerName, settings }) => {
      if (!playerName?.trim()) {
        socket.emit('ROOM_ERROR', { message: 'Name is required' });
        return;
      }

      const { state } = createRoom(socket.id, playerName.trim(), settings);
      socket.join(state.roomCode);

      socket.emit('ROOM_CREATED', {
        roomCode: state.roomCode,
        playerId: socket.id,
      });

      emitLobbyUpdate(io, state.roomCode);
    });

    socket.on('JOIN_ROOM', ({ roomCode, playerName }) => {
      if (!playerName?.trim()) {
        socket.emit('ROOM_ERROR', { message: 'Name is required' });
        return;
      }
      if (!roomCode?.trim()) {
        socket.emit('ROOM_ERROR', { message: 'Room code is required' });
        return;
      }

      const code = roomCode.trim().toUpperCase();
      const { state, error } = joinRoom(code, socket.id, playerName.trim());

      if (error || !state) {
        socket.emit('ROOM_ERROR', { message: error || 'Failed to join room' });
        return;
      }

      socket.join(code);

      socket.emit('ROOM_JOINED', {
        roomCode: code,
        playerId: socket.id,
      });

      emitLobbyUpdate(io, code);
    });

    socket.on('UPDATE_SETTINGS', ({ settings }) => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) {
        socket.emit('ROOM_ERROR', { message: 'Not in a room' });
        return;
      }

      const { error } = updateSettings(roomCode, socket.id, settings);
      if (error) {
        socket.emit('ROOM_ERROR', { message: error });
        return;
      }

      emitLobbyUpdate(io, roomCode);
    });

    // ── Game Start ────────────────────────────────────────────────────

    socket.on('START_GAME', () => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) {
        socket.emit('ROOM_ERROR', { message: 'Not in a room' });
        return;
      }

      const { state, error } = startGame(roomCode, socket.id);
      if (error || !state) {
        socket.emit('ROOM_ERROR', { message: error || 'Failed to start game' });
        return;
      }

      // Send initial game state to all human players
      for (const player of state.players) {
        if (player.type === 'bot') continue;
        const clientState = toClientState(state, player.id);
        io.to(player.id).emit('GAME_STARTED', { state: clientState });
      }

      // Notify first player or trigger bot
      const firstPlayer = state.players[state.currentPlayerIndex];
      if (firstPlayer.type === 'human') {
        io.to(firstPlayer.id).emit('YOUR_TURN', {
          timeLimit: state.settings.turnTimerSeconds ?? undefined,
        });
      } else {
        scheduleBotTurnIfNeeded(io, roomCode);
      }
    });

    // ── Gameplay Events ───────────────────────────────────────────────

    socket.on('PLAY_CARD', ({ cardId, chosenColor }) => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const state = getRoom(roomCode);
      if (!state || state.phase !== 'playing') return;

      const playerIndex = state.players.findIndex((p) => p.id === socket.id);
      if (playerIndex === -1 || playerIndex !== state.currentPlayerIndex) {
        socket.emit('ROOM_ERROR', { message: 'Not your turn' });
        return;
      }

      const player = state.players[playerIndex];
      const cardIndex = player.hand.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) {
        socket.emit('ROOM_ERROR', { message: 'Card not in hand' });
        return;
      }

      const card = player.hand[cardIndex];
      const topDiscard = state.discardPile[state.discardPile.length - 1];

      if (!canPlayCard(card, topDiscard, state.currentColor, state.pendingDrawCount, state.settings.variants)) {
        socket.emit('ROOM_ERROR', { message: 'Cannot play this card' });
        return;
      }

      // Wild card without color chosen — prompt
      if (card.isWild && !chosenColor) {
        socket.emit('CHOOSE_COLOR_PROMPT');
        state.phase = 'color_pick';
        const colorPickState = state as ColorPickGameState;
        colorPickState._pendingWildCardId = cardId;
        emitGameStateToAll(io, roomCode);
        return;
      }

      // Remove card from hand
      player.hand.splice(cardIndex, 1);
      if (player.hand.length > 1) player.saidUno = false;

      // Check win
      if (player.hand.length === 0) {
        state.discardPile.push(card);
        if (card.isWild) state.currentColor = chosenColor || 'red';
        else state.currentColor = card.color;
        state.lastAction = `${player.name} played their last card!`;
        pushLog(state, cardLogType(card), `${player.name} played ${cardLabel(card, chosenColor)} — UNO OUT!`);
        checkAndHandleWin(io, roomCode, playerIndex);
        return;
      }

      applyCardEffect(state, card, chosenColor as CardColor | undefined);
      pushLog(state, cardLogType(card), `${player.name} played ${cardLabel(card, chosenColor)}`);

      emitGameStateToAll(io, roomCode);
      scheduleBotTurnIfNeeded(io, roomCode);
    });

    socket.on('CHOOSE_COLOR', ({ color }) => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const state = getRoom(roomCode);
      if (!state || state.phase !== 'color_pick') return;

      const playerIndex = state.players.findIndex((p) => p.id === socket.id);
      if (playerIndex === -1 || playerIndex !== state.currentPlayerIndex) return;

      const colorPickState = state as ColorPickGameState;
      const pendingCardId = colorPickState._pendingWildCardId;
      if (!pendingCardId) return;

      const player = state.players[playerIndex];
      const cardIndex = player.hand.findIndex((c) => c.id === pendingCardId);
      if (cardIndex === -1) return;

      const card = player.hand[cardIndex];
      player.hand.splice(cardIndex, 1);
      delete colorPickState._pendingWildCardId;
      state.phase = 'playing';
      if (player.hand.length > 1) player.saidUno = false;

      if (player.hand.length === 0) {
        state.discardPile.push(card);
        state.currentColor = color;
        state.lastAction = `${player.name} played their last card!`;
        pushLog(state, 'wild', `${player.name} played ${cardLabel(card, color)} — UNO OUT!`);
        checkAndHandleWin(io, roomCode, playerIndex);
        return;
      }

      applyCardEffect(state, card, color);
      pushLog(state, 'wild', `${player.name} played ${cardLabel(card, color)}`);

      emitGameStateToAll(io, roomCode);
      scheduleBotTurnIfNeeded(io, roomCode);
    });

    socket.on('DRAW_CARD', () => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const state = getRoom(roomCode);
      if (!state || state.phase !== 'playing') return;

      const playerIndex = state.players.findIndex((p) => p.id === socket.id);
      if (playerIndex === -1 || playerIndex !== state.currentPlayerIndex) return;

      const player = state.players[playerIndex];

      if (state.pendingDrawCount > 0) {
        const count = state.pendingDrawCount;
        drawCards(state, playerIndex, count);
        state.lastAction = `${player.name} drew ${count} cards`;
        pushLog(state, 'draw', `${player.name} drew ${count} cards (forced)`);
        state.pendingDrawCount = 0;
        state.currentPlayerIndex = nextPlayerIndex(
          state.currentPlayerIndex,
          state.direction,
          state.players.length
        );
      } else {
        drawCards(state, playerIndex, 1);
        const drawnCard = player.hand[player.hand.length - 1];
        state.lastAction = `${player.name} drew a card`;
        pushLog(state, 'draw', `${player.name} drew a card`);

        const topDiscard = state.discardPile[state.discardPile.length - 1];
        if (
          drawnCard &&
          canPlayCard(drawnCard, topDiscard, state.currentColor, 0, state.settings.variants)
        ) {
          // Player can play drawn card or pass — stay as current player
        } else {
          state.currentPlayerIndex = nextPlayerIndex(
            state.currentPlayerIndex,
            state.direction,
            state.players.length
          );
        }
      }

      state.turnStartTime = Date.now();
      emitGameStateToAll(io, roomCode);
      scheduleBotTurnIfNeeded(io, roomCode);
    });

    socket.on('PASS_TURN', () => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const state = getRoom(roomCode);
      if (!state || state.phase !== 'playing') return;

      const playerIndex = state.players.findIndex((p) => p.id === socket.id);
      if (playerIndex === -1 || playerIndex !== state.currentPlayerIndex) return;

      state.currentPlayerIndex = nextPlayerIndex(
        state.currentPlayerIndex,
        state.direction,
        state.players.length
      );
      state.turnStartTime = Date.now();
      state.lastAction = `${state.players[playerIndex].name} passed`;

      emitGameStateToAll(io, roomCode);
      scheduleBotTurnIfNeeded(io, roomCode);
    });

    // ── UNO Events ──────────────────────────────────────────────────

    socket.on('SAY_UNO', () => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const state = getRoom(roomCode);
      if (!state || state.phase !== 'playing') return;

      const player = state.players.find((p) => p.id === socket.id);
      if (!player) return;

      // Can only say UNO when you have 1 or 2 cards (saying it preemptively before playing)
      if (player.hand.length <= 2) {
        player.saidUno = true;
        io.to(roomCode).emit('UNO_CALLED', { playerId: socket.id });
        pushLog(state, 'uno', `${player.name} called UNO!`);
        emitGameStateToAll(io, roomCode);
      }
    });

    socket.on('CHALLENGE_UNO', ({ targetPlayerId }) => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const state = getRoom(roomCode);
      if (!state || state.phase !== 'playing') return;

      const target = state.players.find((p) => p.id === targetPlayerId);
      if (!target) return;

      // Target must have exactly 1 card and not have said UNO
      if (target.hand.length === 1 && !target.saidUno) {
        const catcher = state.players.find((p) => p.id === socket.id);
        drawCards(state, state.players.indexOf(target), 2);
        target.saidUno = true; // Prevent double-catch
        state.lastAction = `${target.name} was caught not saying UNO! +2 cards`;
        pushLog(state, 'penalty', `${catcher?.name ?? 'Someone'} caught ${target.name} — +2 cards!`);

        io.to(roomCode).emit('UNO_PENALTY', { playerId: targetPlayerId });
        emitGameStateToAll(io, roomCode);
      }
    });

    // ── Rematch ─────────────────────────────────────────────────────

    socket.on('REQUEST_REMATCH', () => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;

      const { state, error } = rematchGame(roomCode);
      if (error || !state) {
        socket.emit('ROOM_ERROR', { message: error || 'Failed to rematch' });
        return;
      }

      // Send new game state to all human players
      for (const player of state.players) {
        if (player.type === 'bot') continue;
        const clientState = toClientState(state, player.id);
        io.to(player.id).emit('REMATCH_STARTED', { state: clientState });
      }

      // Trigger bot turn if first player is a bot
      const firstPlayer = state.players[state.currentPlayerIndex];
      if (firstPlayer.type === 'human') {
        io.to(firstPlayer.id).emit('YOUR_TURN', {
          timeLimit: state.settings.turnTimerSeconds ?? undefined,
        });
      } else {
        scheduleBotTurnIfNeeded(io, roomCode);
      }
    });

    // ── Chat ─────────────────────────────────────────────────────────

    socket.on('SEND_MESSAGE', ({ message }) => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const state = getRoom(roomCode);
      if (!state) return;

      const player = state.players.find((p) => p.id === socket.id);
      if (!player) return;

      const trimmed = message.trim().slice(0, 200);
      if (!trimmed) return;

      io.to(roomCode).emit('CHAT_MESSAGE', {
        playerId: socket.id,
        playerName: player.name,
        message: trimmed,
        timestamp: Date.now(),
      });
    });

    // ── Force Stop ────────────────────────────────────────────────────

    socket.on('FORCE_STOP', () => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const state = getRoom(roomCode);
      if (!state) return;
      if (state.hostId !== socket.id) {
        socket.emit('ROOM_ERROR', { message: 'Only the host can stop the game' });
        return;
      }
      if (state.phase !== 'playing' && state.phase !== 'color_pick') {
        socket.emit('ROOM_ERROR', { message: 'No game in progress' });
        return;
      }

      // If vote already running, ignore
      if (activeVotes.has(roomCode)) return;

      const humanCount = state.players.filter((p) => p.type === 'human').length;

      // Solo with bots — stop immediately
      if (humanCount <= 1) {
        const { state: stopped, error } = forceStopGame(roomCode, socket.id);
        if (error || !stopped) {
          socket.emit('ROOM_ERROR', { message: error || 'Failed to stop game' });
          return;
        }
        cancelBotTimer(roomCode);
        io.to(roomCode).emit('FORCE_STOPPED');
        emitLobbyUpdate(io, roomCode);
        return;
      }

      // Multiplayer — start a vote
      const endsAt = Date.now() + 10_000;
      const votes = new Map<string, boolean>();
      votes.set(socket.id, true); // Host votes yes automatically

      const timer = setTimeout(() => resolveVote(io, roomCode), 10_000);

      activeVotes.set(roomCode, {
        initiator: socket.id,
        votes,
        totalHumans: humanCount,
        endsAt,
        timer,
      });

      const initiatorName = state.players.find((p) => p.id === socket.id)?.name || 'Host';
      io.to(roomCode).emit('FORCE_STOP_VOTE_STARTED', { initiator: initiatorName, endsAt });
      io.to(roomCode).emit('FORCE_STOP_VOTE_UPDATE', { yes: 1, no: 0, total: humanCount, endsAt });
    });

    socket.on('FORCE_STOP_VOTE', ({ vote }) => {
      const roomCode = getRoomCodeBySocketId(socket.id);
      if (!roomCode) return;
      const voteState = activeVotes.get(roomCode);
      if (!voteState) return;

      // Only humans who haven't voted yet
      if (voteState.votes.has(socket.id)) return;
      const state = getRoom(roomCode);
      if (!state) return;
      const player = state.players.find((p) => p.id === socket.id);
      if (!player || player.type !== 'human') return;

      voteState.votes.set(socket.id, vote);

      let yes = 0, no = 0;
      for (const v of voteState.votes.values()) {
        if (v) yes++; else no++;
      }

      io.to(roomCode).emit('FORCE_STOP_VOTE_UPDATE', {
        yes, no, total: voteState.totalHumans, endsAt: voteState.endsAt,
      });

      // All voted — resolve early
      if (voteState.votes.size >= voteState.totalHumans) {
        clearTimeout(voteState.timer);
        resolveVote(io, roomCode);
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────

    socket.on('LEAVE_ROOM', () => {
      handleDisconnect(io, socket);
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: ${socket.id}`);
      handleDisconnect(io, socket);
    });
  });
}

function handleDisconnect(io: IO, socket: { id: string }) {
  const roomCode = getRoomCodeBySocketId(socket.id);
  if (!roomCode) return;

  const state = leaveRoom(roomCode, socket.id);
  if (state) {
    if (state.phase === 'waiting') {
      emitLobbyUpdate(io, roomCode);
    } else {
      io.to(roomCode).emit('PLAYER_DISCONNECTED', { playerId: socket.id });
      emitGameStateToAll(io, roomCode);
    }
  } else {
    // Room was destroyed
    cancelBotTimer(roomCode);
  }
}
