/**
 * usePWAInstall — shared PWA install state for Spellful.
 *
 * Detects:
 *  - standalone (already installed as PWA)
 *  - native Capacitor app (do not prompt)
 *  - iOS Safari (manual instructions only)
 *  - Android/Chrome with beforeinstallprompt (native prompt)
 *  - in-app browser (Instagram, Facebook, etc.) — open-in-browser guidance
 *  - desktop Chrome/Edge with install support
 *  - everything else — generic fallback
 *
 * Banner dismissal (localStorage) is separate from the permanent profile
 * help entry — dismissing the banner never hides the profile section.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type InstallEnv =
  | 'standalone'      // already installed / running as PWA
  | 'capacitor'       // native Capacitor iOS/Android app
  | 'ios-safari'      // iOS Safari — manual share-sheet instructions
  | 'android-prompt'  // Android Chrome/compatible — native prompt available
  | 'desktop-prompt'  // Desktop Chrome/Edge — native prompt available
  | 'in-app-browser'  // Instagram, Facebook, etc. — must open in real browser
  | 'manual'          // any other browser — show generic manual instructions
  | 'unknown';        // SSR / window not available yet

export interface PWAInstallState {
  env: InstallEnv;
  /** true once the app is confirmed installed / running standalone */
  isInstalled: boolean;
  /** true if the native browser install prompt is ready to fire */
  canPrompt: boolean;
  /** fire the native install prompt (only when canPrompt === true) */
  triggerPrompt: () => Promise<void>;
  /** whether the promotional banner has been dismissed this session */
  bannerDismissed: boolean;
  dismissBanner: () => void;
}

const DISMISS_KEY = 'pwa-banner-dismissed';

function safeLocalGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeLocalSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* incognito / disabled */ }
}

function detectEnv(): InstallEnv {
  if (typeof window === 'undefined') return 'unknown';

  // Native Capacitor — window.Capacitor is injected by the native bridge
  if (
    typeof (window as unknown as Record<string, unknown>)['Capacitor'] !== 'undefined' &&
    (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  ) return 'capacitor';

  // Already running as installed PWA
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (isStandalone) return 'standalone';

  const ua = navigator.userAgent;

  // In-app browsers (Instagram, Facebook, Twitter/X, LinkedIn, etc.)
  if (/FBAN|FBAV|Instagram|LinkedInApp|Twitter|Snapchat|TikTok/i.test(ua)) return 'in-app-browser';

  // iOS Safari (no beforeinstallprompt)
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  if (isIos && isSafari) return 'ios-safari';

  // Desktop (non-mobile)
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
  if (!isMobile) return 'desktop-prompt'; // may downgrade to 'manual' if no prompt fires

  // Android / other mobile
  return 'android-prompt'; // may downgrade to 'manual' if no prompt fires
}

export function usePWAInstall(): PWAInstallState {
  const [env, setEnv] = useState<InstallEnv>('unknown');
  const [isInstalled, setIsInstalled] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const deferredPrompt = useRef<(Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> }) | null>(null);

  useEffect(() => {
    const detected = detectEnv();
    setEnv(detected);
    setIsInstalled(detected === 'standalone' || detected === 'capacitor');
    setBannerDismissed(safeLocalGet(DISMISS_KEY) === '1');

    if (detected === 'standalone' || detected === 'capacitor' || detected === 'ios-safari' || detected === 'in-app-browser') {
      return; // no prompt listener needed
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };
      setCanPrompt(true);
      // Confirm the env is prompt-capable
      setEnv(prev => prev === 'manual' ? prev : prev);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setCanPrompt(false);
      deferredPrompt.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    // If no prompt fires within 3 s on a "prompt" env, downgrade to manual
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt.current) {
        setEnv(prev =>
          prev === 'android-prompt' || prev === 'desktop-prompt' ? 'manual' : prev
        );
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const triggerPrompt = useCallback(async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setCanPrompt(false);
      deferredPrompt.current = null;
    }
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    safeLocalSet(DISMISS_KEY, '1');
  }, []);

  return { env, isInstalled, canPrompt, triggerPrompt, bannerDismissed, dismissBanner };
}
