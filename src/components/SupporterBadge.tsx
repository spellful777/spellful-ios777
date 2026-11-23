/**
 * SupporterBadge — Spellful Plus Supporter emblem.
 *
 * Renders ONLY when:
 *   1. The user has an active, server-verified Plus entitlement
 *   2. The user has explicitly opted in to showing the badge
 *
 * The badge is NEVER self-assigned via client storage, profile fields, or
 * role editing. Entitlement is always verified server-side.
 *
 * Accessibility: includes aria-label per spec.
 * "Spellful Plus Supporter — This member helps keep Spellful's core education
 *  and community free for everyone."
 */

interface SupporterBadgeProps {
  /** Size in pixels (default 18) */
  size?: number;
  /** Show tooltip on hover/focus */
  showTooltip?: boolean;
  className?: string;
}

const ARIA_LABEL =
  'Spellful Plus Supporter — This member helps keep Spellful\'s core education and community free for everyone.';

export function SupporterBadge({ size = 18, showTooltip = true, className = '' }: SupporterBadgeProps) {
  return (
    <span
      role="img"
      aria-label={ARIA_LABEL}
      title={showTooltip ? ARIA_LABEL : undefined}
      className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        {/* Moon crescent — primary brand color */}
        <path
          d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5S12.83 18 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c.83 0 1.5-.67 1.5-1.5S12.83 3 12 3z"
          fill="hsl(var(--primary))"
          opacity="0.9"
        />
        {/* Large star */}
        <path
          d="M18 2l.75 2.25L21 5l-2.25.75L18 8l-.75-2.25L15 5l2.25-.75L18 2z"
          fill="hsl(var(--primary))"
        />
        {/* Small accent star */}
        <path
          d="M21 10l.4 1.2 1.2.4-1.2.4L21 13l-.4-1.2-1.2-.4 1.2-.4L21 10z"
          fill="hsl(var(--accent))"
        />
      </svg>
    </span>
  );
}

export { ARIA_LABEL as SUPPORTER_BADGE_ARIA_LABEL };
