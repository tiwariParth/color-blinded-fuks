'use client';

import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/hooks/useGameState';
import { RoomCodeDisplay } from '@/components/ui/RoomCodeDisplay';
import { PlayerSlot } from '@/components/lobby/PlayerSlot';
import { SettingsPanel } from '@/components/lobby/SettingsPanel';

export function LobbyRoom() {
  const { updateSettings, leaveRoom, startGame } = useSocket();
  const { roomCode, playerId, players, settings, hostId } = useGameStore();

  const isHost = playerId === hostId;

  if (!roomCode || !settings) return null;

  return (
    <div className="flex flex-1 items-start justify-center p-4 pt-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
            Room Lobby
          </p>
          <RoomCodeDisplay code={roomCode} />
        </div>

        {/* Players */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Players
            </h3>
            <span className="text-xs text-zinc-600">
              {players.length}/{settings.maxPlayers}
            </span>
          </div>
          <div className="space-y-1.5">
            {players.map((player, i) => (
              <PlayerSlot
                key={player.id}
                player={player}
                index={i}
                isHost={player.id === hostId}
                isYou={player.id === playerId}
              />
            ))}
            {Array.from(
              { length: settings.maxPlayers - players.length },
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-800/60 px-4 py-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/40 text-xs text-zinc-700">
                    {players.length + i + 1}
                  </span>
                  <span className="text-xs text-zinc-700">
                    Bot fills at start
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Settings */}
        {isHost ? (
          <SettingsPanel settings={settings} onUpdate={updateSettings} />
        ) : (
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Settings
            </h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-zinc-600">Timer</span>
              <span className="text-zinc-400 text-right">
                {settings.turnTimerSeconds ? `${settings.turnTimerSeconds}s` : 'Off'}
              </span>
              <span className="text-zinc-600">Bots</span>
              <span className="text-zinc-400 capitalize text-right">{settings.botDifficulty}</span>
              <span className="text-zinc-600">Stacking</span>
              <span className="text-zinc-400 text-right">{settings.variants.stacking ? 'On' : 'Off'}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {isHost && (
            <button
              onClick={startGame}
              disabled={players.length < 1}
              className="group relative flex-1 overflow-hidden rounded-xl py-3.5 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #3DAA4F 0%, #2a8a38 100%)' }}
            >
              <span className="relative z-10">Start Game</span>
              <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10" />
            </button>
          )}
          <button
            onClick={leaveRoom}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3.5 text-sm font-medium text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-400"
          >
            Leave
          </button>
        </div>

        {!isHost && (
          <p className="text-center text-xs text-zinc-600">
            Waiting for host to start...
          </p>
        )}
      </motion.div>
    </div>
  );
}
