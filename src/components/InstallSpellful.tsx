/**
 * InstallSpellful — reusable "Add Spellful to Home Screen" card.
 *
 * Props:
 *   variant  'banner'  — compact dismissible strip (Messages, Home)
 *            'section' — permanent accordion row (Profile Studio)
 *
 * The banner respects the bannerDismissed flag from usePWAInstall.
 * The section variant is always visible (never hidden by dismissal).
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Smartphone } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { usePWAInstall, type InstallEnv } from '@/hooks/usePWAInstall';

// ── Platform-specific instruction sets ───────────────────────────────────────

interface Step { step: number; text: string }

function iosSteps(): Step[] {
  return [
    { step: 1, text: 'Open Spellful in Safari on your iPhone or iPad.' },
    { step: 2, text: 'Tap the Share button (the box with an arrow pointing up) at the bottom of the screen.' },
    { step: 3, text: 'Scroll down and choose "Add to Home Screen".' },
    { step: 4, text: 'Confirm the name "Spellful", then tap Add.' },
    { step: 5, text: 'Open Spellful from your Home Screen — it launches like an app.' },
  ];
}

function androidSteps(): Step[] {
  return [
    { step: 1, text: 'Open Spellful in Chrome (or another supported browser) on your Android device.' },
    { step: 2, text: 'Tap the browser menu (three dots in the top-right corner).' },
    { step: 3, text: 'Choose "Install app" or "Add to Home screen" if offered.' },
    { step: 4, text: 'Follow the confirmation steps.' },
    { step: 5, text: 'Open Spellful from your Home Screen for an app-like experience.' },
  ];
}

function desktopSteps(): Step[] {
  return [
    { step: 1, text: 'Look for the install icon (⊕) in your browser\'s address bar, or open the browser menu.' },
    { step: 2, text: 'Choose "Install Spellful" or "Install app".' },
    { step: 3, text: 'Confirm the installation. Spellful will open in its own window.' },
  ];
}

function inAppSteps(): Step[] {
  return [
    { step: 1, text: 'This browser doesn\'t support home-screen installation directly.' },
    { step: 2, text: 'Tap the "…" or share icon and choose "Open in Safari" (iOS) or "Open in Chrome" (Android).' },
    { step: 3, text: 'Once in Safari or Chrome, follow the steps above to add Spellful to your Home Screen.' },
  ];
}

function stepsForEnv(env: InstallEnv): Step[] {
  if (env === 'ios-safari') return iosSteps();
  if (env === 'android-prompt' || env === 'manual') return androidSteps();
  if (env === 'desktop-prompt') return desktopSteps();
  if (env === 'in-app-browser') return inAppSteps();
  return androidSteps(); // fallback
}

// ── Shared instruction panel ──────────────────────────────────────────────────

function InstallInstructions({ env, canPrompt, triggerPrompt }: {
  env: InstallEnv;
  canPrompt: boolean;
  triggerPrompt: () => Promise<void>;
}) {
  const steps = stepsForEnv(env);
  const showPromptButton = canPrompt && (env === 'android-prompt' || env === 'desktop-prompt');

  return (
    <div className="space-y-3 pt-1">
      {showPromptButton && (
        <button
          onClick={() => void triggerPrompt()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          <Smartphone className="w-4 h-4" aria-hidden="true" />
          Install Spellful
        </button>
      )}

      {!showPromptButton && (
        <ol className="space-y-2" aria-label="Installation steps">
          {steps.map(({ step, text }) => (
            <li key={step} className="flex items-start gap-3 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              <span
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5"
                style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}
                aria-hidden="true"
              >
                {step}
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      )}

      {env === 'in-app-browser' && (
        <button
          onClick={() => {
            try { navigator.clipboard.writeText('https://spellful.com'); } catch { /* silent */ }
          }}
          className="text-xs underline underline-offset-2 transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
        >
          Copy spellful.com link
        </button>
      )}
    </div>
  );
}

// ── Banner variant ────────────────────────────────────────────────────────────

function InstallBanner() {
  const { env, isInstalled, canPrompt, triggerPrompt, bannerDismissed, dismissBanner } = usePWAInstall();
  const [expanded, setExpanded] = useState(false);
  const instructionsId = 'install-banner-instructions';

  // Don't show banner if: already installed, native app, iOS (App Store instead), banner dismissed, or env unknown/SSR
  if (isInstalled || env === 'capacitor' || env === 'standalone' || env === 'ios-safari' || env === 'unknown' || bannerDismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      role="region"
      aria-label="Add Spellful to your home screen"
    >
      <div className="flex items-center gap-2.5 px-3 py-2">
        {/* App icon — compact 32px */}
        <img
          src="/airo-assets/images/pwa/app-icon"
          alt="Spellful app icon"
          className="w-8 h-8 rounded-lg shrink-0"
          style={{ border: '1px solid hsl(var(--border))' }}
          width={32}
          height={32}
          loading="lazy"
        />

        {/* Text — single line, truncated if needed */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight truncate" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
            Add Spellful to your Home Screen
          </p>
          <p className="text-[10px] leading-tight" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            One tap away
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {canPrompt ? (
            <button
              onClick={() => void triggerPrompt()}
              className="text-xs px-2.5 py-1 rounded-full font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              Install
            </button>
          ) : (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
              aria-expanded={expanded}
              aria-controls={instructionsId}
            >
              How to add
              {expanded ? <ChevronUp className="w-3 h-3" aria-hidden="true" /> : <ChevronDown className="w-3 h-3" aria-hidden="true" />}
            </button>
          )}
          <button
            onClick={dismissBanner}
            className="w-6 h-6 flex items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Dismiss install banner"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <span aria-hidden="true" className="text-sm leading-none">×</span>
          </button>
        </div>
      </div>

      {/* Expandable instructions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={instructionsId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <InstallInstructions env={env} canPrompt={canPrompt} triggerPrompt={triggerPrompt} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Section variant (Profile Studio) ─────────────────────────────────────────

function InstallSection() {
  const { env, isInstalled, canPrompt, triggerPrompt } = usePWAInstall();
  const [expanded, setExpanded] = useState(false);
  const instructionsId = 'install-section-instructions';

  // Native app — show "you're using the app" row
  if (env === 'capacitor') {
    return (
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
        role="region"
        aria-label="Spellful app status"
      >
        <img src="/airo-assets/images/pwa/app-icon" alt="" className="w-8 h-8 rounded-lg shrink-0" width={32} height={32} loading="lazy" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>You're using the Spellful app</p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Installed from the App Store or Google Play.</p>
        </div>
      </div>
    );
  }

  // iOS — direct to App Store instead of PWA instructions
  if (env === 'ios-safari') {
    return (
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        role="region"
        aria-label="Get Spellful on the App Store"
      >
        <img src="/airo-assets/images/pwa/app-icon" alt="" className="w-10 h-10 rounded-xl shrink-0" width={40} height={40} loading="lazy" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Get the Spellful app</p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Download on the App Store for the full experience.</p>
        </div>
        <a
          href="https://apps.apple.com/app/spellful/id6738286867"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          App Store
        </a>
      </div>
    );
  }

  // Already installed as PWA
  if (isInstalled) {
    return (
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
        role="region"
        aria-label="Spellful app status"
      >
        <img src="/airo-assets/images/pwa/app-icon" alt="" className="w-8 h-8 rounded-lg shrink-0" width={32} height={32} loading="lazy" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Spellful is on your home screen ✦</p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>You're already running Spellful as an app.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      role="region"
      aria-label="Install Spellful"
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        aria-expanded={expanded}
        aria-controls={instructionsId}
      >
        <img
          src="/airo-assets/images/pwa/app-icon"
          alt="Spellful app icon"
          className="w-10 h-10 rounded-xl shrink-0"
          style={{ border: '1px solid hsl(var(--border))' }}
          width={40}
          height={40}
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
            {canPrompt ? 'Install Spellful' : 'Add Spellful to Home Screen'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            Keep tarot, horoscopes, your Grimoire, and the Spellful community one tap away.
          </p>
        </div>
        <span style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expandable instructions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={instructionsId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              <InstallInstructions env={env} canPrompt={canPrompt} triggerPrompt={triggerPrompt} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Exports ───────────────────────────────────────────────────────────────────

export { InstallBanner, InstallSection };
