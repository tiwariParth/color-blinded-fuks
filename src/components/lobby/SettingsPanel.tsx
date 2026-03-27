'use client';

import type { GameSettings, BotDifficulty } from '@/lib/types';

interface SettingsPanelProps {
  settings: GameSettings;
  onUpdate: (settings: Partial<GameSettings>) => void;
}

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Settings
      </h3>

      <SettingRow label="Max Players">
        <select
          value={settings.maxPlayers}
          onChange={(e) => onUpdate({ maxPlayers: parseInt(e.target.value) })}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-zinc-600"
        >
          {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </SettingRow>

      <SettingRow label="Turn Timer">
        <select
          value={settings.turnTimerSeconds ?? 'off'}
          onChange={(e) =>
            onUpdate({ turnTimerSeconds: e.target.value === 'off' ? null : parseInt(e.target.value) })
          }
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-zinc-600"
        >
          <option value="off">Off</option>
          <option value="15">15s</option>
          <option value="30">30s</option>
          <option value="60">60s</option>
        </select>
      </SettingRow>

      <SettingRow label="Bot Difficulty">
        <select
          value={settings.botDifficulty}
          onChange={(e) => onUpdate({ botDifficulty: e.target.value as BotDifficulty })}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 outline-none focus:border-zinc-600"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </SettingRow>

      <div className="space-y-2 border-t border-zinc-800/60 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
          Variants
        </p>
        <Toggle
          label="Stacking"
          desc="+2 on +2, +4 on +4"
          checked={settings.variants.stacking}
          onChange={(v) => onUpdate({ variants: { ...settings.variants, stacking: v } })}
        />
        <Toggle
          label="Jump-In"
          desc="Play exact match out of turn"
          checked={settings.variants.jumpIn}
          onChange={(v) => onUpdate({ variants: { ...settings.variants, jumpIn: v } })}
        />
        <Toggle
          label="Seven-0"
          desc="7 = swap hands, 0 = rotate all"
          checked={settings.variants.sevenZero}
          onChange={(v) => onUpdate({ variants: { ...settings.variants, sevenZero: v } })}
        />
        <Toggle
          label="Chaos Cards"
          desc="5 wild power cards with special effects"
          checked={settings.variants.chaosCards}
          onChange={(v) => onUpdate({ variants: { ...settings.variants, chaosCards: v } })}
        />
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-400">{label}</span>
      {children}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1">
      <div>
        <span className="text-sm text-zinc-400">{label}</span>
        <p className="text-[10px] text-zinc-600">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-green-600' : 'bg-zinc-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </label>
  );
}
