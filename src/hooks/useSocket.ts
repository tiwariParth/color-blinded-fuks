'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket/client';
import { useGameStore } from '@/hooks/useGameState';
import type { GameSettings } from '@/lib/types';

export function useSocket() {
  const socket = getSocket();
  const listenersAttached = useRef(false);

  const setRoomInfo = useGameStore((s) => s.setRoomInfo);
  const updateLobby = useGameStore((s) => s.updateLobby);
  const setGameState = useGameStore((s) => s.setGameState);
  const setError = useGameStore((s) => s.setError);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    if (listenersAttached.current) return;
    listenersAttached.current = true;

    socket.on('ROOM_CREATED', ({ roomCode, playerId }) => {
      setRoomInfo(roomCode, playerId);
    });

    socket.on('ROOM_JOINED', ({ roomCode, playerId }) => {
      setRoomInfo(roomCode, playerId);
    });

    socket.on('ROOM_ERROR', ({ message }) => {
      setError(message);
    });

    socket.on('LOBBY_UPDATE', ({ players, settings, hostId }) => {
      updateLobby(players, settings, hostId);
    });

    socket.on('GAME_STARTED', ({ state }) => {
      setGameState(state);
    });

    socket.on('GAME_STATE_UPDATE', ({ state }) => {
      setGameState(state);
    });

    socket.on('GAME_OVER', ({ winnerId, scores }) => {
      useGameStore.getState().setWinner(winnerId, scores);
    });

    socket.on('REMATCH_STARTED', ({ state }) => {
      // Reset winner/scores for the new round, then set game state
      useGameStore.getState().clearRoundResult();
      setGameState(state);
    });

    socket.on('FORCE_STOPPED', () => {
      // Game was force-stopped — reset to lobby state
      useGameStore.getState().clearRoundResult();
      useGameStore.setState({ phase: 'waiting', gameState: null, myHand: [] });
    });

    return () => {
      // Don't disconnect — socket persists across navigations
    };
  }, [socket, setRoomInfo, updateLobby, setGameState, setError]);

  const createRoom = useCallback(
    (playerName: string, settings?: Partial<GameSettings>) => {
      setError(null);
      socket.emit('CREATE_ROOM', { playerName, settings });
    },
    [socket, setError]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string) => {
      setError(null);
      socket.emit('JOIN_ROOM', { roomCode, playerName });
    },
    [socket, setError]
  );

  const updateSettings = useCallback(
    (settings: Partial<GameSettings>) => {
      socket.emit('UPDATE_SETTINGS', { settings });
    },
    [socket]
  );

  const leaveRoom = useCallback(() => {
    socket.emit('LEAVE_ROOM');
  }, [socket]);

  const startGame = useCallback(() => {
    socket.emit('START_GAME');
  }, [socket]);

  const requestRematch = useCallback(() => {
    socket.emit('REQUEST_REMATCH');
  }, [socket]);

  const forceStop = useCallback(() => {
    socket.emit('FORCE_STOP');
  }, [socket]);

  return {
    socket,
    createRoom,
    joinRoom,
    updateSettings,
    leaveRoom,
    startGame,
    requestRematch,
    forceStop,
  };
}
