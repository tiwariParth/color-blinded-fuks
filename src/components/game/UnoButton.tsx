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
      className="rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white"
      style={{
        background: isCall
          ? 'linear-gradient(135deg, #E03A2A 0%, #c0281a 100%)'
          : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        boxShadow: isCall
          ? '0 0 16px rgba(224,58,42,0.4)'
          : '0 0 16px rgba(249,115,22,0.4)',
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.85 }}
      initial={{ scale: 0, rotate: -15 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
      {label}
    </motion.button>
  );
}
