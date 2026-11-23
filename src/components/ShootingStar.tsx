/**
 * ShootingStar
 *
 * A subtle white-lavender shooting star that crosses diagonally across the
 * screen once after sign-in, then replays infrequently (every 30–60 s) while
 * the component is mounted.
 *
 * - Renders behind all content (z-0, pointer-events-none)
 * - Respects prefers-reduced-motion (disabled entirely)
 * - Optimized for mobile: CSS transform only, no layout thrash
 */
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface ShootingStarProps {
  /** Delay in ms before the first shot fires (default 800) */
  initialDelay?: number;
  /** Min ms between replays (default 30000) */
  replayMin?: number;
  /** Max ms between replays (default 60000) */
  replayMax?: number;
}

export default function ShootingStar({
  initialDelay = 800,
  replayMin = 30000,
  replayMax = 60000,
}: ShootingStarProps) {
  const prefersReduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleNext(min: number, max: number) {
    const delay = min + Math.random() * (max - min);
    timerRef.current = setTimeout(() => {
      setActive(true);
      // Animation lasts ~1.6 s; reset after
      timerRef.current = setTimeout(() => {
        setActive(false);
        scheduleNext(min, max);
      }, 1800);
    }, delay);
  }

  useEffect(() => {
    if (prefersReduced) return;
    // First shot
    timerRef.current = setTimeout(() => {
      setActive(true);
      timerRef.current = setTimeout(() => {
        setActive(false);
        scheduleNext(replayMin, replayMax);
      }, 1800);
    }, initialDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <div
        className="shooting-star"
        style={{
          opacity: active ? 1 : 0,
          transition: active ? 'none' : 'opacity 0.4s ease',
          animation: active ? 'shootingStar 1.5s ease-out forwards' : 'none',
        }}
      />
      <style>{`
        @keyframes shootingStar {
          0% {
            transform: translate(0, 0) rotate(-35deg);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          85% {
            opacity: 0.6;
          }
          100% {
            transform: translate(55vw, 28vh) rotate(-35deg);
            opacity: 0;
          }
        }
        .shooting-star {
          position: absolute;
          top: 8%;
          left: 5%;
          width: 120px;
          height: 1.5px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            hsl(var(--accent) / 0.25) 20%,
            hsl(var(--foreground) / 0.85) 60%,
            white 80%,
            transparent 100%
          );
          border-radius: 9999px;
          box-shadow:
            0 0 6px 1px hsl(var(--accent) / 0.45),
            0 0 14px 2px hsl(var(--foreground) / 0.2);
          will-change: transform, opacity;
        }
        .shooting-star::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: white;
          box-shadow:
            0 0 4px 2px hsl(var(--accent) / 0.7),
            0 0 10px 4px hsl(var(--foreground) / 0.3);
        }
      `}</style>
    </div>
  );
}
