'use client';

import type { UnoCard as UnoCardType, CardColor, CardValue } from '@/lib/types';

const COLOR_MAP: Record<string, { bg: string; oval: string }> = {
  red: { bg: '#E03A2A', oval: '#C0281A' },
  yellow: { bg: '#F5C800', oval: '#D4A800' },
  green: { bg: '#3DAA4F', oval: '#2A8A38' },
  blue: { bg: '#2A6DB5', oval: '#1A5295' },
  wild: { bg: '#1A1A1A', oval: '#333333' },
  chaos: { bg: '#6B21A8', oval: '#581C87' },
};

const CHAOS_LABELS: Record<string, { symbol: string; label: string }> = {
  trade_hands: { symbol: '⇄', label: 'SWAP' },
  hand_bomb: { symbol: '✸', label: 'BOMB' },
  reverse_roulette: { symbol: '↻', label: 'SPIN' },
  freeze: { symbol: '❄', label: 'FREEZE' },
  tax_winner: { symbol: '♛', label: 'TAX' },
};

function getDisplayValue(value: CardValue): string {
  switch (value) {
    case 'skip': return '⊘';
    case 'reverse': return '⟲';
    case 'draw2': return '+2';
    case 'wild': return '★';
    case 'wild_draw4': return '+4';
    default: return CHAOS_LABELS[value]?.symbol ?? value;
  }
}

function isChaosCard(value: CardValue): boolean {
  return value in CHAOS_LABELS;
}

function isActionCard(value: CardValue): boolean {
  return ['skip', 'reverse', 'draw2', 'wild', 'wild_draw4'].includes(value) || isChaosCard(value);
}

interface UnoCardProps {
  card: UnoCardType;
  playable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function UnoCard({ card, playable = true, onClick, size = 'md' }: UnoCardProps) {
  const isChaos = isChaosCard(card.value);
  const colors = isChaos ? COLOR_MAP.chaos : (COLOR_MAP[card.color] || COLOR_MAP.wild);
  const display = getDisplayValue(card.value);
  const chaosLabel = CHAOS_LABELS[card.value]?.label;
  const isAction = isActionCard(card.value);

  const dimensions = {
    sm: { w: 56, h: 80 },
    md: { w: 70, h: 100 },
    lg: { w: 84, h: 120 },
  }[size];

  const fontSize = {
    sm: { corner: 8, center: isAction ? 16 : 22 },
    md: { corner: 10, center: isAction ? 20 : 28 },
    lg: { corner: 12, center: isAction ? 24 : 34 },
  }[size];

  return (
    <svg
      width={dimensions.w}
      height={dimensions.h}
      viewBox="0 0 70 100"
      onClick={playable ? onClick : undefined}
      className={`select-none ${
        playable && onClick
          ? 'cursor-pointer'
          : !playable
            ? 'opacity-40'
            : ''
      }`}
      style={{ filter: playable ? undefined : 'grayscale(0.5)' }}
    >
      {/* Card background */}
      <rect
        x="0"
        y="0"
        width="70"
        height="100"
        rx="6"
        ry="6"
        fill={colors.bg}
        stroke="#000"
        strokeWidth="1"
      />

      {/* White inner border */}
      <rect
        x="4"
        y="4"
        width="62"
        height="92"
        rx="4"
        ry="4"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />

      {/* Center oval */}
      <ellipse
        cx="35"
        cy="50"
        rx="22"
        ry="32"
        fill={card.isWild ? 'transparent' : 'rgba(255,255,255,0.95)'}
        transform="rotate(-15, 35, 50)"
      />

      {/* Wild card: four-color pie */}
      {card.isWild && (
        <g transform="translate(35, 50)">
          <path d="M0,-20 A20,20 0 0,1 20,0 L0,0 Z" fill="#E03A2A" />
          <path d="M20,0 A20,20 0 0,1 0,20 L0,0 Z" fill="#2A6DB5" />
          <path d="M0,20 A20,20 0 0,1 -20,0 L0,0 Z" fill="#3DAA4F" />
          <path d="M-20,0 A20,20 0 0,1 0,-20 L0,0 Z" fill="#F5C800" />
        </g>
      )}

      {/* Center value */}
      <text
        x="35"
        y={isChaos ? 46 : card.isWild ? 54 : 56}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={isChaos ? fontSize.center * 0.9 : fontSize.center}
        fontWeight="bold"
        fill={card.isWild ? '#fff' : colors.bg}
        fontFamily="Arial, sans-serif"
        stroke={card.isWild ? '#000' : 'none'}
        strokeWidth={card.isWild ? 0.5 : 0}
      >
        {display}
      </text>

      {/* Chaos card label */}
      {chaosLabel && (
        <text
          x="35"
          y="62"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="7"
          fontWeight="bold"
          fill="#fff"
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
          opacity="0.9"
        >
          {chaosLabel}
        </text>
      )}

      {/* Top-left corner value */}
      <text
        x="8"
        y="16"
        fontSize={fontSize.corner}
        fontWeight="bold"
        fill="#fff"
        fontFamily="Arial, sans-serif"
        stroke="#000"
        strokeWidth="0.3"
      >
        {display}
      </text>

      {/* Bottom-right corner value (inverted) */}
      <text
        x="62"
        y="90"
        fontSize={fontSize.corner}
        fontWeight="bold"
        fill="#fff"
        fontFamily="Arial, sans-serif"
        textAnchor="end"
        stroke="#000"
        strokeWidth="0.3"
        transform="rotate(180, 62, 86)"
      >
        {display}
      </text>

      {/* Glossy sheen */}
      <rect
        x="0"
        y="0"
        width="70"
        height="40"
        rx="6"
        ry="6"
        fill="url(#sheen)"
        opacity="0.15"
      />
      <defs>
        <linearGradient id="sheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
