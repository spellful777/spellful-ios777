import { useState, useCallback } from 'react';

/**
 * Share Studio — unified share service for Spellful.
 *
 * On native iOS/Android (Capacitor), uses the OS share sheet via @capacitor/share.
 * On web, falls back to the Web Share API when available, then clipboard copy.
 *
 * Usage:
 *   import { shareContent } from '@/lib/share-studio';
 *   await shareContent({ title: 'My Reading', text: 'Three-card spread...', url: 'https://spellful.com/tarot' });
 */

export interface SharePayload {
  /** Short title shown in the share sheet */
  title?: string;
  /** Body text / tweet copy */
  text?: string;
  /** Canonical URL to share */
  url?: string;
  /** Optional: path to a local file URI (native only) */
  files?: string[];
}

export type ShareResult =
  | { method: 'native' }
  | { method: 'web-share-api' }
  | { method: 'clipboard'; copied: string }
  | { method: 'fallback-open'; platform: 'twitter' | 'facebook' };

/**
 * Returns true when running inside a Capacitor native container.
 * Safe to call during SSR — `window` is guarded.
 */
function isNative(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
}

/**
 * Share content using the best available method for the current environment.
 */
export async function shareContent(payload: SharePayload): Promise<ShareResult> {
  const { title = 'Spellful', text = '', url = 'https://spellful.com' } = payload;

  // ── Native (Capacitor iOS / Android) ──────────────────────────────────────
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, url, dialogTitle: title });
      return { method: 'native' };
    } catch {
      // User cancelled or share failed — fall through to web methods
    }
  }

  // ── Web Share API (mobile browsers, some desktop) ─────────────────────────
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return { method: 'web-share-api' };
    } catch {
      // User cancelled — fall through
    }
  }

  // ── Clipboard copy ────────────────────────────────────────────────────────
  const shareText = [text, url].filter(Boolean).join('\n');
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareText);
      return { method: 'clipboard', copied: shareText };
    } catch {
      // Clipboard blocked — fall through
    }
  }

  // ── Last resort: open Twitter intent ─────────────────────────────────────
  const twitterUrl =
    `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&via=spellful`;
  window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  return { method: 'fallback-open', platform: 'twitter' };
}

/**
 * Build a canonical share URL for common Spellful content types.
 */
export function buildShareUrl(type: 'tarot' | 'profile' | 'spell' | 'horoscope', slug?: string): string {
  const base = 'https://spellful.com';
  switch (type) {
    case 'tarot':
      return `${base}/tarot`;
    case 'profile':
      return slug ? `${base}/u/${slug}` : base;
    case 'spell':
      return slug ? `${base}/spells/${slug}` : `${base}/spells`;
    case 'horoscope':
      return `${base}/horoscope`;
    default:
      return base;
  }
}

/**
 * React hook — returns a share function and a `copied` flag for UI feedback.
 *
 * Usage:
 *   const { share, copied } = useShare();
 *   <button onClick={() => share({ text: 'My reading', url: '...' })}>Share</button>
 *   {copied && <span>Copied!</span>}
 */
export function useShare() {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async (payload: SharePayload) => {
    const result = await shareContent(payload);
    if (result.method === 'clipboard') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
    return result;
  }, []);

  return { share, copied };
}
