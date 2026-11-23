/**
 * BrandLogo — Spellful official logo component.
 *
 * Always renders one of the two official master PNG assets:
 *   - WHITE variant: white lettering on transparent background (for dark surfaces)
 *   - BLACK variant: black lettering on transparent background (for light surfaces)
 *
 * Never redraws, regenerates, or substitutes the official artwork.
 * Variant "auto" picks white/black based on the `dark` prop (default: true → white).
 *
 * Usage:
 *   <BrandLogo />                          — white, navigation size, no magic
 *   <BrandLogo variant="white" magical="subtle" size="lg" />
 *   <BrandLogo variant="auto" dark={false} size="sm" />
 */

import { type CSSProperties } from 'react';

// Official master PNG slots — never hardcode filenames in business logic
const LOGO_WHITE_URL = '/airo-assets/images/logo/official-white';
const LOGO_BLACK_URL = '/airo-assets/images/logo/official-black';

export type LogoVariant = 'white' | 'black' | 'auto';
export type LogoContext =
  | 'navigation'
  | 'welcome'
  | 'share'
  | 'creator'
  | 'profile'
  | 'certificate'
  | 'email'
  | 'other';
export type MagicalLevel = 'auto' | 'subtle' | 'full' | 'off';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface BrandLogoProps {
  /** Which logo master to use. "auto" picks based on the `dark` prop. */
  variant?: LogoVariant;
  /** When variant="auto", true → white (dark surface), false → black (light surface). Default: true */
  dark?: boolean;
  /** Rendering context — affects default magical level and size. */
  context?: LogoContext;
  /** Decorative celestial effects around the logo. */
  magical?: MagicalLevel;
  /** Preset size. Overridden by explicit width/height. */
  size?: LogoSize;
  /** Explicit pixel width (preserves aspect ratio via height: auto). */
  width?: number | string;
  /** Additional className on the outer wrapper. */
  className?: string;
  /** Additional inline style on the outer wrapper. */
  style?: CSSProperties;
  /** Alt text override. Defaults to "Spellful" for navigation, full description for rich contexts. */
  alt?: string;
}

const SIZE_MAP: Record<LogoSize, string> = {
  xs: 'h-6',
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-20',
  full: 'h-auto w-full',
};

// Contexts that default to full magical treatment
const FULL_MAGIC_CONTEXTS: LogoContext[] = ['welcome', 'share', 'certificate'];
// Contexts that default to subtle
const SUBTLE_MAGIC_CONTEXTS: LogoContext[] = ['creator', 'profile', 'email'];

function resolveVariant(variant: LogoVariant, dark: boolean): 'white' | 'black' {
  if (variant === 'auto') return dark ? 'white' : 'black';
  return variant;
}

function resolveMagical(magical: MagicalLevel, context: LogoContext): MagicalLevel {
  if (magical !== 'auto') return magical;
  if (FULL_MAGIC_CONTEXTS.includes(context)) return 'full';
  if (SUBTLE_MAGIC_CONTEXTS.includes(context)) return 'subtle';
  return 'off';
}

function resolveAlt(context: LogoContext, alt?: string): string {
  if (alt) return alt;
  if (context === 'welcome' || context === 'share' || context === 'certificate') {
    return 'Spellful logo on a celestial night-sky background.';
  }
  return 'Spellful';
}

// Sparkle positions for subtle/full magic — deterministic to avoid hydration mismatch
const SUBTLE_SPARKLES = [
  { x: '8%', y: '15%', size: 10, opacity: 0.55, delay: 0 },
  { x: '88%', y: '20%', size: 8, opacity: 0.45, delay: 0.8 },
  { x: '50%', y: '82%', size: 7, opacity: 0.4, delay: 1.4 },
];
const FULL_SPARKLES = [
  { x: '5%', y: '10%', size: 14, opacity: 0.65, delay: 0 },
  { x: '90%', y: '15%', size: 11, opacity: 0.55, delay: 0.6 },
  { x: '15%', y: '75%', size: 9, opacity: 0.5, delay: 1.1 },
  { x: '80%', y: '70%', size: 10, opacity: 0.45, delay: 1.7 },
  { x: '50%', y: '5%', size: 8, opacity: 0.4, delay: 2.2 },
];

export default function BrandLogo({
  variant = 'auto',
  dark = true,
  context = 'navigation',
  magical = 'auto',
  size = 'md',
  width,
  className = '',
  style,
  alt,
}: BrandLogoProps) {
  const resolvedVariant = resolveVariant(variant, dark);
  const resolvedMagical = resolveMagical(magical, context);
  const resolvedAlt = resolveAlt(context, alt);
  const logoUrl = resolvedVariant === 'white' ? LOGO_WHITE_URL : LOGO_BLACK_URL;

  const sizeClass = SIZE_MAP[size];
  const imgStyle: CSSProperties = width
    ? { width, height: 'auto', display: 'block', objectFit: 'contain' }
    : { height: '100%', width: 'auto', display: 'block', objectFit: 'contain' };

  const sparkles =
    resolvedMagical === 'subtle'
      ? SUBTLE_SPARKLES
      : resolvedMagical === 'full'
        ? FULL_SPARKLES
        : [];

  return (
    <span
      className={`${sizeClass} ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      aria-label={resolvedAlt}
      role="img"
    >
      {sparkles.map((sp, i) => (
        <svg
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: sp.x,
            top: sp.y,
            width: sp.size,
            height: sp.size,
            opacity: sp.opacity,
            animation: `spellful-twinkle 2.4s ease-in-out ${sp.delay}s infinite alternate`,
            pointerEvents: 'none',
          }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
        </svg>
      ))}
      <img
        src={logoUrl}
        alt={resolvedAlt}
        style={imgStyle}
        loading="eager"
        fetchPriority={context === 'navigation' ? 'high' : 'auto'}
        draggable={false}
      />
    </span>
  );
}
