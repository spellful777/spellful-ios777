/**
 * SolarReturnModal — Birthday week popup ("Your Solar Return")
 *
 * Shown once per birthday week per member. Fetches the reflection from
 * /api/birthday/reflection and dismisses via /api/birthday/reflection/dismiss.
 *
 * Design: dark midnight/purple/gold, elegant serif headlines, celestial SVG
 * backdrop, internal scroll area, accessible focus trap.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Clock } from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';

interface ReflectionData {
  reflection: string;
  year: number;
  journalSaved: boolean;
  dismissed: boolean;
  inBirthdayWeek: boolean;
  name: string | null;
}

type ModalState = 'idle' | 'loading' | 'open' | 'saving' | 'saved' | 'closed';

// ── Celestial SVG backdrop ────────────────────────────────────────────────────
function CelestialBackdrop() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="srGlow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="hsl(var(--sr-bg-mid))" stopOpacity="0.7" />
          <stop offset="100%" stopColor="hsl(var(--sr-bg-deep))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="srMoonGlow" cx="50%" cy="28%" r="18%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#srGlow)" />
      <circle cx="50%" cy="28%" r="80" fill="url(#srMoonGlow)" />
      {/* Crescent moon */}
      <g transform="translate(50%, 28%) scale(0.9)">
        <circle cx="0" cy="-60" r="28" fill="hsl(var(--primary))" opacity="0.85" />
        <circle cx="10" cy="-60" r="22" fill="hsl(var(--sr-bg-deep))" />
      </g>
      {/* Stars */}
      {([
        [15, 12], [82, 8], [25, 55], [75, 18], [60, 72], [10, 80],
        [90, 65], [45, 90], [35, 20], [68, 42], [50, 5], [20, 38],
        [88, 30], [55, 60], [30, 75],
      ] as [number, number][]).map(([cx, cy], i) => (
        <circle
          key={i}
          cx={`${cx}%`}
          cy={`${cy}%`}
          r={i % 3 === 0 ? 1.5 : 1}
          fill="hsl(var(--sr-gold))"
          opacity={0.4 + (i % 4) * 0.15}
        />
      ))}
      <path
        d="M 10% 95% Q 50% 5% 90% 95%"
        stroke="hsl(var(--accent))"
        strokeWidth="0.5"
        fill="none"
        opacity="0.12"
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SolarReturnModal() {
  const { session, isPending } = useSession();
  const [state, setModalState] = useState<ModalState>('idle');
  const [data, setData] = useState<ReflectionData | null>(null);
  const [saveError, setSaveError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const isOpen = state === 'open' || state === 'saving' || state === 'saved';

  // ── Fetch reflection on mount (once user is known) ────────────────────────
  useEffect(() => {
    if (isPending || !session?.user?.id) return;
    if (state !== 'idle') return;

    setModalState('loading');

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    fetch(`/api/birthday/reflection?tz=${encodeURIComponent(tz)}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() as Promise<ReflectionData> : null)
      .then((d) => {
        if (!d || !d.inBirthdayWeek || d.dismissed) {
          setModalState('closed');
          return;
        }
        setData(d);
        // Small delay so the page settles before the popup appears
        setTimeout(() => {
          triggerRef.current = document.activeElement as HTMLElement;
          setModalState('open');
        }, 1200);
      })
      .catch(() => setModalState('closed'));
  }, [isPending, session?.user?.id, state]);

  // ── Focus trap ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => closeButtonRef.current?.focus(), 50);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        void handleNotNow();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const dismiss = useCallback(async () => {
    if (!data) return;
    try {
      await fetch('/api/birthday/reflection/dismiss', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: data.year }),
      });
    } catch {
      // Non-fatal
    }
  }, [data]);

  const handleNotNow = useCallback(async () => {
    setModalState('closed');
    await dismiss();
    triggerRef.current?.focus();
  }, [dismiss]);

  const handleSaveJournal = useCallback(async () => {
    if (!data || state === 'saving' || state === 'saved') return;
    setModalState('saving');
    setSaveError(false);
    try {
      const r = await fetch('/api/birthday/reflection/save-journal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: data.year }),
      });
      if (r.ok) {
        setData((prev) => prev ? { ...prev, journalSaved: true } : prev);
        setModalState('saved');
        setTimeout(() => {
          setModalState('closed');
          void dismiss();
          triggerRef.current?.focus();
        }, 2500);
      } else {
        setSaveError(true);
        setModalState('open');
      }
    } catch {
      setSaveError(true);
      setModalState('open');
    }
  }, [data, state, dismiss]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (state === 'idle' || state === 'loading' || state === 'closed') return null;

  const firstName = data?.name?.split(' ')[0] ?? 'Witch';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sr-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[200] bg-black/85"
            onClick={() => void handleNotNow()}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="sr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sr-title"
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
            className="fixed inset-x-4 bottom-4 top-[max(env(safe-area-inset-top,16px),16px)] z-[201] mx-auto flex flex-col overflow-hidden rounded-2xl shadow-2xl md:inset-x-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:bottom-auto md:max-h-[90vh]"
            style={{
              background: `linear-gradient(160deg, hsl(var(--sr-bg-deep)) 0%, hsl(var(--sr-bg-mid)) 50%, hsl(var(--sr-bg-edge)) 100%)`,
              border: '1px solid hsl(var(--sr-border))',
            }}
          >
            {/* Celestial SVG */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              <CelestialBackdrop />
            </div>

            {/* Close button */}
            <button
              ref={closeButtonRef}
              onClick={() => void handleNotNow()}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
              style={{ color: 'hsl(var(--accent))' }}
              aria-label="Close birthday message"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable content */}
            <div className="relative flex-1 overflow-y-auto px-6 pt-10 pb-6 flex flex-col gap-5">

              {/* Eyebrow */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] tracking-widest uppercase font-medium text-primary">
                  Your Solar Return
                </span>
              </div>

              {/* Headline */}
              <div className="text-center">
                <h2
                  id="sr-title"
                  className="font-serif text-3xl md:text-4xl leading-tight"
                  style={{ color: 'hsl(var(--sr-gold))' }}
                >
                  Happy Birthday,<br />{firstName}
                </h2>
                <p className="mt-2 text-sm text-accent">
                  {data?.year} — A message from the stars
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-primary">✦</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Reflection text */}
              <div
                className="rounded-xl px-5 py-5 text-sm leading-relaxed text-card-foreground"
                style={{
                  background: 'hsl(var(--sr-card-bg) / 0.6)',
                  border: '1px solid hsl(var(--sr-border-inner))',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {state === 'saved' ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/15">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium text-primary">
                      Saved to your Grimoire
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You can revisit this reflection in your journal any time.
                    </p>
                  </div>
                ) : (
                  <p>{data?.reflection}</p>
                )}
              </div>

              {saveError && (
                <p className="text-xs text-center text-destructive">
                  Something went wrong saving to your journal. Please try again.
                </p>
              )}
            </div>

            {/* Action buttons */}
            {state !== 'saved' && (
              <div
                className="relative flex flex-col gap-2.5 px-6 pb-[max(env(safe-area-inset-bottom,16px),16px)] pt-4"
                style={{ borderTop: '1px solid hsl(var(--sr-border-action))' }}
              >
                <button
                  onClick={() => void handleSaveJournal()}
                  disabled={state === 'saving' || data?.journalSaved}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60 bg-primary text-primary-foreground hover:bg-primary/90"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {state === 'saving' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : data?.journalSaved ? (
                    <>
                      <BookOpen className="w-4 h-4" />
                      Already in your Grimoire
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      Save to My Journal
                    </>
                  )}
                </button>

                <button
                  onClick={() => void handleNotNow()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Not Now
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
