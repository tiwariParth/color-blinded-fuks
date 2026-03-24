'use client';

import type { GameSettings, BotDifficulty } from '@/lib/types';

interface SettingsPanelProps {
  settings: GameSettings;
  onUpdate: (settings: Partial<GameSettings>) => void;
}

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Game Settings
      </h3>

      {/* Max Players */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-300">Max Players</label>
        <select
          value={settings.maxPlayers}
          onChange={(e) => onUpdate({ maxPlayers: parseInt(e.target.value) })}
          className="rounded-md border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-sm text-white outline-none focus:border-zinc-500"
        >
          {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
            <option key={n} value={n}>
              {n} players
            </option>
          ))}
        </select>
      </div>

      {/* Turn Timer */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-300">Turn Timer</label>
        <select
          value={settings.turnTimerSeconds ?? 'off'}
          onChange={(e) =>
            onUpdate({
              turnTimerSeconds: e.target.value === 'off' ? null : parseInt(e.target.value),
            })
          }
          className="rounded-md border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-sm text-white outline-none focus:border-zinc-500"
        >
          <option value="off">Off</option>
          <option value="15">15 seconds</option>
          <option value="30">30 seconds</option>
          <option value="60">60 seconds</option>
        </select>
      </div>

      {/* Bot Difficulty */}
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-300">Bot Difficulty</label>
        <select
          value={settings.botDifficulty}
          onChange={(e) => onUpdate({ botDifficulty: e.target.value as BotDifficulty })}
          className="rounded-md border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-sm text-white outline-none focus:border-zinc-500"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Variant Rules */}
      <div className="space-y-2 border-t border-zinc-700/50 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Variant Rules
        </p>

        <ToggleRow
          label="Stacking"
          description="+2 on +2, +4 on +4"
          checked={settings.variants.stacking}
          onChange={(stacking) => onUpdate({ variants: { ...settings.variants, stacking } })}
        />
        <ToggleRow
          label="Jump-In"
          description="Play exact same card out of turn"
          checked={settings.variants.jumpIn}
          onChange={(jumpIn) => onUpdate({ variants: { ...settings.variants, jumpIn } })}
        />
        <ToggleRow
          label="Seven-0"
          description="7 = swap hands, 0 = rotate all"
          checked={settings.variants.sevenZero}
          onChange={(sevenZero) => onUpdate({ variants: { ...settings.variants, sevenZero } })}
        />
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1">
      <div>
        <span className="text-sm text-zinc-300">{label}</span>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-green-600' : 'bg-zinc-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}
