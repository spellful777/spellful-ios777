/**
 * CosmicBrandBackground — Spellful celestial backdrop for branded surfaces.
 *
 * Renders a deep violet/indigo galaxy background with subtle star field,
 * soft nebula glow, and optional moon element. Designed to host the
 * official BrandLogo on top.
 *
 * Animations are defined in src/styles/globals.css (cosmic-twinkle keyframe).
 * Respects prefers-reduced-motion via the .cosmic-star CSS class.
 *
 * Usage:
 *   <CosmicBrandBackground>
 *     <BrandLogo variant="white" context="welcome" magical="full" size="xl" />
 *   </CosmicBrandBackground>
 */

import { type ReactNode, type CSSProperties } from 'react';

interface CosmicBrandBackgroundProps {
  children?: ReactNode;
  /** Aspect ratio preset. Default: "banner" (16:5). */
  aspect?: 'banner' | 'square' | 'story' | 'card' | 'free';
  /** Additional className on the outer container. */
  className?: string;
  /** Additional inline style on the outer container. */
  style?: CSSProperties;
  /** Intensity of the nebula glow. Default: "medium". */
  intensity?: 'low' | 'medium' | 'high';
  /** Show a crescent moon element in the background. Default: true. */
  showMoon?: boolean;
}

const ASPECT_STYLES: Record<string, CSSProperties> = {
  banner: { aspectRatio: '16 / 5' },
  square: { aspectRatio: '1 / 1' },
  story: { aspectRatio: '9 / 16' },
  card: { aspectRatio: '3 / 2' },
  free: {},
};

// Deterministic star positions — avoids hydration mismatch
const STARS = [
  { cx: 5,  cy: 12, r: 1.2, o: 0.70, d: 0.0 },
  { cx: 15, cy: 5,  r: 0.9, o: 0.60, d: 0.4 },
  { cx: 25, cy: 20, r: 1.5, o: 0.80, d: 0.9 },
  { cx: 35, cy: 8,  r: 0.8, o: 0.50, d: 1.3 },
  { cx: 45, cy: 15, r: 1.1, o: 0.65, d: 0.2 },
  { cx: 55, cy: 4,  r: 1.3, o: 0.75, d: 1.7 },
  { cx: 65, cy: 22, r: 0.9, o: 0.55, d: 0.6 },
  { cx: 75, cy: 9,  r: 1.4, o: 0.70, d: 1.1 },
  { cx: 85, cy: 18, r: 1.0, o: 0.60, d: 0.3 },
  { cx: 92, cy: 6,  r: 1.2, o: 0.65, d: 1.5 },
  { cx: 10, cy: 75, r: 0.8, o: 0.45, d: 0.8 },
  { cx: 20, cy: 85, r: 1.1, o: 0.50, d: 1.2 },
  { cx: 30, cy: 70, r: 0.9, o: 0.55, d: 0.5 },
  { cx: 40, cy: 90, r: 1.3, o: 0.60, d: 1.9 },
  { cx: 50, cy: 78, r: 0.7, o: 0.40, d: 0.7 },
  { cx: 60, cy: 88, r: 1.0, o: 0.50, d: 1.4 },
  { cx: 70, cy: 72, r: 1.2, o: 0.60, d: 0.1 },
  { cx: 80, cy: 82, r: 0.8, o: 0.45, d: 1.6 },
  { cx: 90, cy: 68, r: 1.1, o: 0.55, d: 0.9 },
  { cx: 95, cy: 92, r: 0.9, o: 0.50, d: 2.0 },
];

export default function CosmicBrandBackground({
  children,
  aspect = 'banner',
  className = '',
  style,
  intensity = 'medium',
  showMoon = true,
}: CosmicBrandBackgroundProps) {
  const nebulaOpacity = intensity === 'low' ? 0.25 : intensity === 'high' ? 0.55 : 0.38;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: `radial-gradient(ellipse at 50% 40%, hsl(var(--cosmic-bg-center)) 0%, hsl(var(--cosmic-bg-mid)) 45%, hsl(var(--cosmic-bg-edge)) 100%)`,
        ...ASPECT_STYLES[aspect],
        ...style,
      }}
      aria-hidden="true"
    >
      {/* SVG star field + nebula — animations driven by globals.css keyframes */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        {/* Nebula glow blobs */}
        <ellipse
          cx="30" cy="35" rx="28" ry="20"
          fill="hsl(var(--cosmic-nebula-violet))"
          opacity={nebulaOpacity}
          style={{ filter: 'blur(8px)' }}
        />
        <ellipse
          cx="72" cy="60" rx="22" ry="16"
          fill="hsl(var(--cosmic-nebula-blue))"
          opacity={nebulaOpacity * 0.7}
          style={{ filter: 'blur(10px)' }}
        />
        <ellipse
          cx="50" cy="50" rx="18" ry="12"
          fill="hsl(var(--cosmic-nebula-purple))"
          opacity={nebulaOpacity * 0.5}
          style={{ filter: 'blur(12px)' }}
        />

        {/* Stars — .cosmic-star class disables animation when prefers-reduced-motion */}
        {STARS.map((s, i) => (
          <circle
            key={i}
            className="cosmic-star"
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            fill="white"
            opacity={s.o}
            style={{ animation: `cosmic-twinkle ${2.2 + s.d}s ease-in-out ${s.d}s infinite` }}
          />
        ))}

        {/* Optional crescent moon */}
        {showMoon && (
          <g transform="translate(78, 8) scale(0.12)" opacity="0.55">
            <circle cx="50" cy="50" r="48" fill="white" />
            <circle cx="68" cy="42" r="42" fill="hsl(var(--cosmic-bg-edge))" />
          </g>
        )}
      </svg>

      {/* Content slot */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}
