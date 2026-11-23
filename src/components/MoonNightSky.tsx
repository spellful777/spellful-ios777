/**
 * MoonNightSky — ambient moon + night-sky animation layer.
 * Drop inside any `relative overflow-hidden` hero section.
 * All positions are seeded so SSR and client match (no hydration flash).
 */
import { motion } from 'motion/react';

// ── Seeded PRNG (no Math.random on render) ────────────────────────────────────
function sr(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ── Star field ────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  top: `${sr(i * 5) * 100}%`,
  left: `${sr(i * 5 + 1) * 100}%`,
  size: sr(i * 5 + 2) * 2.4 + 0.5,
  dur: 3 + sr(i * 7) * 6,
  delay: sr(i * 11) * 8,
  color:
    i % 9 === 0
      ? 'hsl(var(--primary))'
      : i % 6 === 0
      ? 'hsl(var(--accent))'
      : 'hsl(var(--foreground))',
  glow: i % 11 === 0,
}));

// ── Shooting stars ────────────────────────────────────────────────────────────
const SHOOTS = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  top: `${10 + sr(i * 13) * 40}%`,
  left: `${sr(i * 13 + 1) * 60}%`,
  angle: 20 + sr(i * 13 + 2) * 25,
  dur: 1.1 + sr(i * 13 + 3) * 0.6,
  // stagger each shooting star far apart so they feel random
  delay: 2 + i * 7 + sr(i * 13 + 4) * 5,
  repeatDelay: 18 + sr(i * 13 + 5) * 14,
  len: 80 + sr(i * 13 + 6) * 60,
}));

// ── Moon SVG ──────────────────────────────────────────────────────────────────
function CrescentMoon({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer glow */}
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonFace" cx="38%" cy="38%" r="62%">
          <stop offset="0%" stopColor="hsl(44 80% 88%)" />
          <stop offset="60%" stopColor="hsl(44 60% 72%)" />
          <stop offset="100%" stopColor="hsl(44 40% 52%)" />
        </radialGradient>
      </defs>
      {/* Soft halo */}
      <circle cx="36" cy="36" r="34" fill="url(#moonGlow)" />
      {/* Moon body — crescent via clip */}
      <clipPath id="crescentClip">
        {/* Full circle minus offset circle = crescent */}
        <path
          fillRule="evenodd"
          d="M36 6a30 30 0 1 1 0 60A30 30 0 0 1 36 6z M48 10a26 26 0 1 0 0 52A26 26 0 0 0 48 10z"
        />
      </clipPath>
      <circle cx="36" cy="36" r="30" fill="url(#moonFace)" clipPath="url(#crescentClip)" />
      {/* Subtle crater dots */}
      <g clipPath="url(#crescentClip)" opacity="0.18">
        <circle cx="28" cy="30" r="3.5" fill="hsl(44 30% 40%)" />
        <circle cx="22" cy="42" r="2.2" fill="hsl(44 30% 40%)" />
        <circle cx="34" cy="48" r="1.8" fill="hsl(44 30% 40%)" />
      </g>
    </svg>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface MoonNightSkyProps {
  /** Where to anchor the moon. Defaults to top-right. */
  moonPosition?: 'top-right' | 'top-left' | 'top-center';
  /** Moon size in px. Defaults to 88. */
  moonSize?: number;
  /** Opacity of the whole layer (0–1). Defaults to 1. */
  opacity?: number;
  /** Show shooting stars. Defaults to true. */
  shootingStars?: boolean;
  /** Show star field. Defaults to true. */
  starField?: boolean;
  /** Vertical position of the moon as a CSS value. Defaults to '30%'. */
  moonTop?: string;
}

export default function MoonNightSky({
  moonPosition = 'top-right',
  moonSize = 88,
  opacity = 1,
  shootingStars = true,
  starField = true,
  moonTop = '30%',
}: MoonNightSkyProps) {
  const moonPos =
    moonPosition === 'top-right'
      ? { top: moonTop, right: '8%' }
      : moonPosition === 'top-left'
      ? { top: moonTop, left: '8%' }
      : { top: moonTop, left: '50%', transform: 'translateX(-50%)' };

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* ── Star field ── */}
      {starField &&
        STARS.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              background: s.color,
              boxShadow: s.glow ? `0 0 ${s.size * 2.5}px 1px ${s.color}` : undefined,
            }}
            animate={{
              opacity: [0.05, s.glow ? 0.55 : 0.22, 0.05],
              scale: [1, s.glow ? 1.5 : 1.15, 1],
            }}
            transition={{
              duration: s.dur,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: s.delay,
            }}
          />
        ))}

      {/* ── Shooting stars ── */}
      {shootingStars &&
        SHOOTS.map((sh) => (
          <motion.div
            key={sh.id}
            className="absolute"
            style={{
              top: sh.top,
              left: sh.left,
              rotate: sh.angle,
              width: sh.len,
              height: 1.5,
              background:
                'linear-gradient(to right, transparent, hsl(var(--primary) / 0.9), hsl(var(--foreground) / 0.6), transparent)',
              borderRadius: 2,
            }}
            initial={{ opacity: 0, scaleX: 0, x: 0 }}
            animate={{
              opacity: [0, 0.9, 0.7, 0],
              scaleX: [0, 1, 1, 0],
              x: [0, sh.len * 1.4],
            }}
            transition={{
              duration: sh.dur,
              repeat: Infinity,
              repeatDelay: sh.repeatDelay,
              delay: sh.delay,
              ease: 'easeOut',
            }}
          />
        ))}

      {/* ── Moon ── */}
      <motion.div
        className="absolute"
        style={moonPos}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.2, ease: 'easeOut', delay: 0.3 }}
      >
        {/* Slow drift */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Pulse glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.22) 0%, transparent 70%)',
              transform: 'scale(1.6)',
            }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [1.5, 1.9, 1.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <CrescentMoon size={moonSize} />
        </motion.div>
      </motion.div>

      {/* ── Orbiting sparkle dots around the moon ── */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * 360;
        const radius = moonSize * 0.78;
        const rad = (angle * Math.PI) / 180;
        const cx = moonSize / 2 + Math.cos(rad) * radius;
        const cy = moonSize / 2 + Math.sin(rad) * radius;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              ...moonPos,
              width: 3,
              height: 3,
              background: 'hsl(var(--primary))',
              boxShadow: '0 0 6px 2px hsl(var(--primary) / 0.7)',
              marginLeft: cx - 1.5,
              marginTop: cy - 1.5,
            }}
            animate={{
              rotate: [0, 360],
              opacity: [0.3, 0.9, 0.3],
            }}
            transition={{
              rotate: { duration: 22 + i * 4, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 1.2 },
            }}
          />
        );
      })}
    </div>
  );
}
