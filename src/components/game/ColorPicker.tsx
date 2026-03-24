'use client';

import { motion } from 'framer-motion';
import type { CardColor } from '@/lib/types';

const COLORS: { color: CardColor; bg: string; label: string }[] = [
  { color: 'red', bg: '#E03A2A', label: 'Red' },
  { color: 'yellow', bg: '#F5C800', label: 'Yellow' },
  { color: 'green', bg: '#3DAA4F', label: 'Green' },
  { color: 'blue', bg: '#2A6DB5', label: 'Blue' },
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="rounded-2xl bg-zinc-800 p-6 shadow-2xl"
      >
        <h3 className="mb-4 text-center text-lg font-semibold text-white">
          Choose a color
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.map(({ color, bg, label }, i) => (
            <motion.button
              key={color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: i * 0.07,
                type: 'spring',
                stiffness: 400,
                damping: 20,
              }}
              onClick={() => onChoose(color)}
              className="flex h-20 w-20 items-center justify-center rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-110"
              style={{ backgroundColor: bg }}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
