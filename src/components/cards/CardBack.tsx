'use client';

interface CardBackProps {
  size?: 'sm' | 'md' | 'lg';
}

export function CardBack({ size = 'md' }: CardBackProps) {
  const dimensions = {
    sm: { w: 56, h: 80 },
    md: { w: 70, h: 100 },
    lg: { w: 84, h: 120 },
  }[size];

  return (
    <svg
      width={dimensions.w}
      height={dimensions.h}
      viewBox="0 0 70 100"
      className="select-none"
    >
      {/* Dark background */}
      <rect
        x="0"
        y="0"
        width="70"
        height="100"
        rx="6"
        ry="6"
        fill="#1a1a2e"
        stroke="#000"
        strokeWidth="1"
      />

      {/* Border pattern */}
      <rect
        x="4"
        y="4"
        width="62"
        height="92"
        rx="4"
        ry="4"
        fill="none"
        stroke="#e03a2a"
        strokeWidth="2"
      />

      {/* Center oval */}
      <ellipse
        cx="35"
        cy="50"
        rx="20"
        ry="28"
        fill="#e03a2a"
        transform="rotate(-15, 35, 50)"
      />

      {/* UNO text */}
      <text
        x="35"
        y="54"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="18"
        fontWeight="900"
        fill="#F5C800"
        fontFamily="Arial, sans-serif"
        transform="rotate(-15, 35, 50)"
        letterSpacing="1"
      >
        UNO
      </text>
    </svg>
  );
}
