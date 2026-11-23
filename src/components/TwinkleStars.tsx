/**
 * TwinkleStars — lightweight twinkling star overlay.
 * Drop inside any `relative overflow-hidden` container.
 * Uses a seeded PRNG so SSR and client produce identical positions (no hydration flash).
 *
 * Props:
 *   count      — number of stars (default 40)
 *   opacity    — overall layer opacity 0–1 (default 0.8)
 *   className  — extra classes on the wrapper div
 */
import { motion } from 'motion/react';

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
function sr(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface TwinkleStarsProps {
  count?: number;
  opacity?: number;
  className?: string;
}

export default function TwinkleStars({
  count = 40,
  opacity = 0.8,
  className = '',
}: TwinkleStarsProps) {
  const stars = Array.from({ length: count }, (_, i) => {
    const isGold   = i % 11 === 0;
    const isAccent = i % 7 === 0;
    const color = isGold
      ? 'hsl(var(--primary))'
      : isAccent
      ? 'hsl(var(--accent))'
      : 'hsl(var(--foreground))';
    const size    = sr(i * 3 + 0) * 1.8 + 0.6;   // 0.6 – 2.4 px
    const dur     = 2.5 + sr(i * 3 + 1) * 5;      // 2.5 – 7.5 s
    const delay   = sr(i * 3 + 2) * 9;             // 0 – 9 s
    const glow    = i % 13 === 0;
    return {
      id: i,
      top:   `${sr(i * 5 + 10) * 100}%`,
      left:  `${sr(i * 5 + 11) * 100}%`,
      size, dur, delay, color, glow,
    };
  });

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            top:        s.top,
            left:       s.left,
            width:      s.size,
            height:     s.size,
            background: s.color,
            boxShadow:  s.glow
              ? `0 0 ${s.size * 3}px 1px ${s.color}`
              : undefined,
          }}
          animate={{
            opacity: [0.04, s.glow ? 0.7 : 0.3, 0.04],
            scale:   [1,    s.glow ? 1.6 : 1.2,  1],
          }}
          transition={{
            duration:   s.dur,
            repeat:     Infinity,
            ease:       'easeInOut',
            delay:      s.delay,
          }}
        />
      ))}
    </div>
  );
}
