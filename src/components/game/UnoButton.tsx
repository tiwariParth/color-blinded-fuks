'use client';

import { motion } from 'framer-motion';

interface UnoButtonProps {
  onClick: () => void;
  label?: string;
  variant?: 'call' | 'catch';
}

export function UnoButton({ onClick, label = 'UNO!', variant = 'call' }: UnoButtonProps) {
  const isCall = variant === 'call';

  return (
    <motion.button
      onClick={onClick}
      className={`rounded-full px-6 py-3 text-lg font-black uppercase tracking-wider text-white shadow-lg ${
        isCall
          ? 'bg-red-600 shadow-red-600/40 hover:bg-red-500'
          : 'bg-orange-500 shadow-orange-500/40 hover:bg-orange-400'
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.85 }}
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
      {label}
    </motion.button>
  );
}
