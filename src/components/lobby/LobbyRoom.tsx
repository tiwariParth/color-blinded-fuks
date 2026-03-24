'use client';

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
    <div className="flex flex-1 items-start justify-center p-4 pt-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-xl font-semibold text-zinc-300">Room Lobby</h2>
          <RoomCodeDisplay code={roomCode} />
        </div>

        {/* Players */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Players ({players.length}/{settings.maxPlayers})
            </h3>
          </div>
          <div className="space-y-2">
            {players.map((player, i) => (
              <PlayerSlot
                key={player.id}
                player={player}
                index={i}
                isHost={player.id === hostId}
                isYou={player.id === playerId}
              />
            ))}
            {/* Empty slots */}
            {Array.from(
              { length: settings.maxPlayers - players.length },
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-700/40 px-4 py-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-600">
                    {players.length + i + 1}
                  </span>
                  <span className="text-sm text-zinc-600">
                    Waiting for player... (bot will fill)
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Settings (host only) */}
        {isHost && (
          <SettingsPanel settings={settings} onUpdate={updateSettings} />
        )}

        {/* Settings (non-host view) */}
        {!isHost && (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Game Settings
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-zinc-500">Timer</span>
              <span className="text-zinc-300">
                {settings.turnTimerSeconds ? `${settings.turnTimerSeconds}s` : 'Off'}
              </span>
              <span className="text-zinc-500">Bot Difficulty</span>
              <span className="text-zinc-300 capitalize">{settings.botDifficulty}</span>
              <span className="text-zinc-500">Stacking</span>
              <span className="text-zinc-300">{settings.variants.stacking ? 'On' : 'Off'}</span>
              <span className="text-zinc-500">Jump-In</span>
              <span className="text-zinc-300">{settings.variants.jumpIn ? 'On' : 'Off'}</span>
              <span className="text-zinc-500">Seven-0</span>
              <span className="text-zinc-300">{settings.variants.sevenZero ? 'On' : 'Off'}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {isHost && (
            <button
              onClick={startGame}
              disabled={players.length < 1}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Game
            </button>
          )}
          <button
            onClick={leaveRoom}
            className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-3 font-semibold text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Leave
          </button>
        </div>

        {/* Waiting message */}
        {!isHost && (
          <p className="text-center text-sm text-zinc-500">
            Waiting for host to start the game...
          </p>
        )}
      </div>
    </div>
  );
}
