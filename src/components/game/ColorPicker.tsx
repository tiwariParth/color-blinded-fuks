'use client';

import { motion } from 'framer-motion';
import type { CardColor } from '@/lib/types';

const COLORS: { color: CardColor; bg: string; glow: string }[] = [
  { color: 'red',    bg: '#E03A2A', glow: 'rgba(224,58,42,0.5)' },
  { color: 'blue',   bg: '#2A6DB5', glow: 'rgba(42,109,181,0.5)' },
  { color: 'green',  bg: '#3DAA4F', glow: 'rgba(61,170,79,0.5)' },
  { color: 'yellow', bg: '#F5C800', glow: 'rgba(245,200,0,0.5)' },
];

interface ColorPickerProps {
  onChoose: (color: CardColor) => void;
}

export function ColorPicker({ onChoose }: ColorPickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
        className="flex flex-col items-center gap-5"
      >
        <span className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-400">
          Pick a color
        </span>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {COLORS.map(({ color, bg, glow }, i) => (
            <motion.button
              key={color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.05 + i * 0.06,
                type: 'spring',
                stiffness: 400,
                damping: 18,
              }}
              onClick={() => onChoose(color)}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl transition-transform"
              style={{
                backgroundColor: bg,
                boxShadow: `0 0 24px 4px ${glow}, inset 0 2px 4px rgba(255,255,255,0.2)`,
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
