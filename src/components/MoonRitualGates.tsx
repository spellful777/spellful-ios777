/**
 * Moon Ritual 2.0 — Gates D, E, F1, F2
 *
 * Gate D: GuidedRitualMode   — animated step-by-step, materials checklist, per-step timer
 * Gate E: LunarJourney       — upcoming phase timeline with aligned ritual suggestions
 * Gate F1: FolkloreLibrary   — cultural moon traditions from around the world
 * Gate F2: GrimoireNoteEditor — personal notes on saved rituals
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown, ChevronUp, ChevronRight,
  Calendar, Globe, Timer, Play, Pause, RotateCcw,
  CheckSquare, Square, Check, X, Pencil,
} from 'lucide-react';
import type { RitualRecommendation, MoonPhaseKey, IntentionKey } from '@/lib/moon-ritual-data';
import type { UpcomingPhaseDate } from '@/lib/moon-phase-engine';

// ─── Helpers (duplicated from moon-ritual.tsx to keep this file self-contained) ─

const FLAME_KEYWORDS = ['candle', 'flame', 'burn', 'incense', 'smoke', 'fire', 'light a'];

function stepHasFlame(step: string): boolean {
  return FLAME_KEYWORDS.some(kw => step.toLowerCase().includes(kw));
}

function smokeFreeStep(step: string): string {
  return step
    .replace(/light(s|ed)? (a |an |the )?(candle|incense)/gi, 'place (or switch on) a battery candle / diffuser')
    .replace(/burn(ing|s|ed)? (the |a |an )?(bay leaf|paper|letter|incense|herbs?)/gi, 'fold and keep (or safely discard) the $3')
    .replace(/candle/gi, 'battery candle')
    .replace(/incense/gi, 'essential oil diffuser')
    .replace(/smoke/gi, 'scent')
    .replace(/flame/gi, 'light');
}

// ══════════════════════════════════════════════════════════════════════════════
// GATE D — Guided Step-by-Step Ritual Mode
// ══════════════════════════════════════════════════════════════════════════════

export interface GuidedRitualModeProps {
  ritual: RitualRecommendation;
  smokeFree: boolean;
  onComplete: (completedAt: string) => void;
  onExit: () => void;
}

export function GuidedRitualMode({ ritual, smokeFree, onComplete, onExit }: GuidedRitualModeProps) {
  const baseSteps = smokeFree ? ritual.steps.map(smokeFreeStep) : ritual.steps;

  // Materials checklist: herbs + crystals + candle/diffuser
  const materials: string[] = [
    ...ritual.herbs.map(h => `Herb: ${h}`),
    ...ritual.crystals.map(c => `Crystal: ${c}`),
    ...(ritual.candle && !smokeFree ? [`Candle: ${ritual.candle}`] : []),
    ...(smokeFree ? ['Battery candle or LED light', 'Essential oil diffuser (optional)'] : []),
  ];

  const [phase, setPhase] = useState<'checklist' | 'steps' | 'complete'>('checklist');
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);

  // Per-step timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setTimerRunning(true);
    intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setTimerSeconds(0);
  }, [pauseTimer]);

  // Reset timer when step changes
  useEffect(() => { resetTimer(); }, [currentStep, resetTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const toggleCheck = (i: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const progress = phase === 'checklist' ? 0
    : phase === 'complete' ? 100
    : Math.round(((currentStep + 1) / baseSteps.length) * 100);

  const hasFlameSteps = ritual.steps.some(stepHasFlame);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.3)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ background: 'hsl(var(--card-deep))', borderBottom: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">🕯️</span>
          <div>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Guided Ritual Mode
            </p>
            <p className="text-base" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
              {ritual.ritualName}
            </p>
          </div>
        </div>
        <button
          onClick={onExit}
          aria-label="Exit guided mode"
          className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full" style={{ background: 'hsl(var(--muted))' }}>
        <motion.div
          className="h-full"
          style={{ background: 'hsl(var(--primary))' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="p-5 md:p-6">

        {/* ── Phase: Materials Checklist ── */}
        {phase === 'checklist' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <h3 className="text-xl mb-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
              Gather Your Materials
            </h3>
            <p className="text-sm mb-5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Check off each item as you gather it. You can begin when you're ready — nothing is required.
            </p>

            {smokeFree && hasFlameSteps && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs"
                style={{ background: 'hsl(var(--accent) / 0.12)', border: '1px solid hsl(var(--accent) / 0.3)', color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}
              >
                Candles replaced with battery candles · incense replaced with diffuser
              </div>
            )}

            <div className="space-y-2 mb-6">
              {materials.map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggleCheck(i)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{
                    background: checkedItems.has(i) ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted))',
                    border: `1px solid ${checkedItems.has(i) ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
                  }}
                >
                  {checkedItems.has(i)
                    ? <CheckSquare className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} aria-hidden="true" />
                    : <Square className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                  }
                  <span
                    className="text-sm"
                    style={{
                      color: checkedItems.has(i) ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                      fontFamily: 'var(--font-sans)',
                      textDecoration: checkedItems.has(i) ? 'line-through' : 'none',
                      opacity: checkedItems.has(i) ? 0.7 : 1,
                    }}
                  >
                    {item}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {checkedItems.size} of {materials.length} gathered
              </p>
              <button
                onClick={() => setPhase('steps')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                Begin Ritual
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Phase: Steps ── */}
        {phase === 'steps' && (
          <div>
            {/* Step counter + timer */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Step {currentStep + 1} of {baseSteps.length}
              </p>
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
              >
                <Timer className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                <span
                  className="text-xs font-mono"
                  style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', minWidth: '2.5rem' }}
                >
                  {formatTime(timerSeconds)}
                </span>
                <button
                  onClick={timerRunning ? pauseTimer : startTimer}
                  aria-label={timerRunning ? 'Pause timer' : 'Start timer'}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  {timerRunning
                    ? <Pause className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} aria-hidden="true" />
                    : <Play className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} aria-hidden="true" />
                  }
                </button>
                <button
                  onClick={resetTimer}
                  aria-label="Reset timer"
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  <RotateCcw className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Animated step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="min-h-[120px] flex items-start gap-4 p-5 rounded-2xl mb-6"
                style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
              >
                <span
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                  aria-hidden="true"
                >
                  {currentStep + 1}
                </span>
                <p className="text-base leading-relaxed pt-0.5" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                  {baseSteps[currentStep]}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}
              >
                <ChevronRight className="w-4 h-4 rotate-180" aria-hidden="true" />
                Previous
              </button>

              {currentStep < baseSteps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(s => s + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  Continue
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  onClick={() => { setPhase('complete'); onComplete(new Date().toISOString()); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  Complete Ritual
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Phase: Complete ── */}
        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-4"
          >
            <span className="text-5xl block mb-4" aria-hidden="true">🌕</span>
            <h3 className="text-2xl mb-2" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
              Ritual Complete
            </h3>
            <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              You have completed the {ritual.ritualName}. Take a moment to breathe and return to yourself.
            </p>
            <button
              onClick={onExit}
              className="px-5 py-2.5 rounded-full text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}
            >
              Return to Ritual
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GATE E — Lunar Journey Timeline
// ══════════════════════════════════════════════════════════════════════════════

// Phase → best intention alignment for ritual suggestions
const PHASE_ALIGNED_INTENTIONS: Record<string, Array<{ intention: IntentionKey; label: string; icon: string }>> = {
  new_moon:        [{ intention: 'manifestation', label: 'Manifestation', icon: '✨' }, { intention: 'clarity',       label: 'Clarity',       icon: '🔮' }],
  waxing_crescent: [{ intention: 'love',          label: 'Love',          icon: '💕' }, { intention: 'abundance',     label: 'Abundance',     icon: '🌿' }],
  first_quarter:   [{ intention: 'courage',       label: 'Courage',       icon: '🔥' }, { intention: 'manifestation', label: 'Manifestation', icon: '✨' }],
  waxing_gibbous:  [{ intention: 'abundance',     label: 'Abundance',     icon: '🌿' }, { intention: 'healing',       label: 'Healing',       icon: '💚' }],
  full_moon:       [{ intention: 'gratitude',     label: 'Gratitude',     icon: '🌕' }, { intention: 'love',          label: 'Love',          icon: '💕' }],
  waning_gibbous:  [{ intention: 'healing',       label: 'Healing',       icon: '💚' }, { intention: 'clarity',       label: 'Clarity',       icon: '🔮' }],
  last_quarter:    [{ intention: 'release',       label: 'Release',       icon: '🍂' }, { intention: 'protection',    label: 'Protection',    icon: '🛡️' }],
  waning_crescent: [{ intention: 'release',       label: 'Release',       icon: '🍂' }, { intention: 'clarity',       label: 'Clarity',       icon: '🔮' }],
};

// Map UpcomingPhaseDate phase name → moon-ritual-data MoonPhaseKey
const PHASE_NAME_TO_KEY: Record<string, MoonPhaseKey> = {
  'New Moon':      'new_moon',
  'First Quarter': 'first_quarter',
  'Full Moon':     'full_moon',
  'Last Quarter':  'last_quarter',
};

export interface LunarJourneyProps {
  upcomingPhases: UpcomingPhaseDate[];
  onSelectPhaseIntention: (phase: MoonPhaseKey, intention: IntentionKey) => void;
}

export function LunarJourney({ upcomingPhases, onSelectPhaseIntention }: LunarJourneyProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      aria-labelledby="lunar-journey-heading"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        aria-expanded={open}
        aria-controls="lunar-journey-panel"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--primary))' }} aria-hidden="true" />
          <div>
            <h2 id="lunar-journey-heading" className="text-xl" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
              Your Lunar Journey
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Upcoming phases and aligned rituals for the next cycle
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="lunar-journey-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-6 pb-5 md:pb-6" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              {/* Timeline */}
              <div className="relative mt-5">
                {/* Vertical connector line */}
                <div
                  className="absolute left-5 top-5 bottom-5 w-px"
                  style={{ background: 'hsl(var(--border))' }}
                  aria-hidden="true"
                />

                <div className="space-y-6">
                  {upcomingPhases.map((p, idx) => {
                    const phaseKey = PHASE_NAME_TO_KEY[p.phase];
                    const aligned = phaseKey ? (PHASE_ALIGNED_INTENTIONS[phaseKey] ?? []) : [];
                    return (
                      <div key={p.phase} className="relative flex gap-4 pl-14">
                        {/* Phase node */}
                        <div
                          className="absolute left-0 w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                          style={{
                            background: idx === 0 ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))',
                            border: `2px solid ${idx === 0 ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                          }}
                          aria-hidden="true"
                        >
                          {p.glyph}
                        </div>

                        <div className="flex-1 min-w-0 pb-2">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-base" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                              {p.phase}
                            </p>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: idx === 0 ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                                color: idx === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                                fontFamily: 'var(--font-sans)',
                              }}
                            >
                              {p.label} · {p.daysAway === 0 ? 'Today' : p.daysAway === 1 ? 'Tomorrow' : `in ${p.daysAway}d`}
                            </span>
                          </div>

                          {/* Aligned ritual suggestion chips */}
                          {aligned.length > 0 && phaseKey && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {aligned.map(({ intention, label, icon }) => (
                                <button
                                  key={intention}
                                  onClick={() => onSelectPhaseIntention(phaseKey, intention)}
                                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  style={{
                                    background: 'hsl(var(--muted))',
                                    border: '1px solid hsl(var(--border))',
                                    color: 'hsl(var(--foreground))',
                                    fontFamily: 'var(--font-sans)',
                                  }}
                                  aria-label={`Plan ${label} ritual for ${p.phase}`}
                                >
                                  <span aria-hidden="true">{icon}</span>
                                  {label} ritual
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs mt-5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Phase dates calculated using Meeus astronomical algorithms (±2 min). Ritual suggestions are traditional lunar correspondences.{' '}
                <Link to="/astronomical-accuracy" className="underline" style={{ color: 'hsl(var(--primary))' }}>
                  How we calculate this →
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GATE F1 — Folklore Library
// ══════════════════════════════════════════════════════════════════════════════

interface FolkloreTradition {
  id: string;
  culture: string;
  region: string;
  tradition: string;
  phase: string;
  description: string;
  practice: string;
}

const FOLKLORE_TRADITIONS: FolkloreTradition[] = [
  {
    id: 'celtic-dark-moon',
    culture: 'Celtic',
    region: 'British Isles',
    tradition: 'The Dark Moon Vigil',
    phase: 'New Moon',
    description: 'In Celtic tradition, the new moon — called the "dark moon" — was a time of deep listening. Druids would sit in silence from dusk to dawn, believing the veil between worlds was thinnest when the moon was invisible.',
    practice: 'Sit in darkness for a few minutes before sleep. Ask one question aloud, then listen in silence. Write whatever arises in a journal.',
  },
  {
    id: 'chinese-mid-autumn',
    culture: 'Chinese',
    region: 'East Asia',
    tradition: 'Moon Goddess Offering',
    phase: 'Full Moon',
    description: "During the Mid-Autumn Festival, offerings of mooncakes, pomelos, and incense are made to Chang'e, the Moon Goddess who lives in a palace on the moon. Families gather outdoors to admire the full moon together.",
    practice: 'Place round fruits (pomelo, apple, or orange) on a windowsill or outdoor table. Light a candle and express gratitude for family and abundance.',
  },
  {
    id: 'yoruba-osun',
    culture: 'Yoruba',
    region: 'West Africa & Diaspora',
    tradition: "Osun River Blessing",
    phase: 'Full Moon',
    description: 'Osun, the Yoruba orisha of rivers, love, and fertility, is honored under the full moon. Devotees bring offerings of honey, oranges, and yellow flowers to rivers or bodies of water, singing praise songs.',
    practice: 'Bring honey and a yellow flower to any water source — a river, lake, or even a bowl of water. Offer gratitude for love and abundance in your life.',
  },
  {
    id: 'norse-disablot',
    culture: 'Norse',
    region: 'Scandinavia',
    tradition: 'Dísablót — Honoring the Dísir',
    phase: 'Waning Moon',
    description: 'The Dísablót was a Norse winter ritual honoring the Dísir — female ancestral spirits connected to the moon\'s waning phase. Offerings of ale, bread, and candles were left at the threshold to invite ancestral protection.',
    practice: 'Leave a small offering of bread and a candle at your doorstep or windowsill. Speak the names of female ancestors you wish to honor.',
  },
  {
    id: 'hindu-karva-chauth',
    culture: 'Hindu',
    region: 'South Asia',
    tradition: 'Karva Chauth Moon Sighting',
    phase: 'Waxing Moon',
    description: 'On the fourth day after the full moon in Kartik, married women fast from sunrise until they sight the moon. The moon is viewed through a sieve, then the husband\'s face — symbolizing the moon\'s protective light filtering through life\'s challenges.',
    practice: 'On any waxing moon night, view the moon through your cupped hands or a piece of cloth. Offer a prayer for those you love.',
  },
  {
    id: 'maori-maramataka',
    culture: 'Māori',
    region: 'Aotearoa New Zealand',
    tradition: 'Maramataka — Lunar Calendar',
    phase: 'All Phases',
    description: 'The Maramataka is a living lunar calendar used by Māori to determine the best times for planting, fishing, harvesting, and ceremony. Each night of the lunar month has a name and associated activity, connecting daily life to the moon\'s rhythm.',
    practice: 'For one full lunar cycle, note the moon\'s phase each evening and record one observation about your energy, sleep, or mood. Look for patterns.',
  },
  {
    id: 'greek-hecate',
    culture: 'Ancient Greek',
    region: 'Mediterranean',
    tradition: "Deipnon — Hecate's Supper",
    phase: 'New Moon',
    description: 'On the last night of each lunar month, ancient Greeks left offerings at crossroads for Hecate, goddess of the moon, magic, and transitions. Called the Deipnon, this meal of garlic, eggs, and honey was left to honor the goddess and cleanse the household.',
    practice: 'On the new moon, leave a small offering of garlic, an egg, or honey at your doorstep or a crossroads. Ask Hecate to clear away what no longer serves you.',
  },
  {
    id: 'indigenous-moon-lodge',
    culture: 'Various Indigenous Nations',
    region: 'North America',
    tradition: 'Moon Lodge Ceremony',
    phase: 'Full Moon',
    description: 'Across many Indigenous nations, the full moon was a time for women to gather in the moon lodge — a sacred space for rest, vision, and ceremony. The moon was understood as a grandmother figure whose light carried wisdom.',
    practice: 'On the full moon, create a quiet space for yourself. Light a candle, sit in stillness, and ask: "What wisdom is this moon offering me right now?"',
  },
];

const FOLKLORE_PHASE_FILTERS = ['All', 'New Moon', 'Waxing Moon', 'Full Moon', 'Waning Moon', 'All Phases'];

export function FolkloreLibrary() {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterPhase, setFilterPhase] = useState('All');

  const filtered = filterPhase === 'All'
    ? FOLKLORE_TRADITIONS
    : FOLKLORE_TRADITIONS.filter(t => t.phase === filterPhase || t.phase === 'All Phases');

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      aria-labelledby="folklore-heading"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        aria-expanded={open}
        aria-controls="folklore-panel"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--accent))' }} aria-hidden="true" />
          <div>
            <h2 id="folklore-heading" className="text-xl" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
              Folklore Library
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Moon ritual traditions from cultures around the world
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="folklore-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 md:px-6 pb-5 md:pb-6" style={{ borderTop: '1px solid hsl(var(--border))' }}>
              {/* Phase filter chips */}
              <div className="flex flex-wrap gap-2 mt-5 mb-5">
                {FOLKLORE_PHASE_FILTERS.map(p => (
                  <button
                    key={p}
                    onClick={() => setFilterPhase(p)}
                    className="text-xs px-3 py-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      background: filterPhase === p ? 'hsl(var(--accent) / 0.2)' : 'hsl(var(--muted))',
                      border: `1px solid ${filterPhase === p ? 'hsl(var(--accent))' : 'hsl(var(--border))'}`,
                      color: filterPhase === p ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filtered.map(tradition => {
                  const isExpanded = expandedId === tradition.id;
                  return (
                    <div
                      key={tradition.id}
                      className="rounded-xl overflow-hidden"
                      style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : tradition.id)}
                        className="w-full flex items-start justify-between gap-4 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                        aria-expanded={isExpanded}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-base" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                              {tradition.tradition}
                            </p>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full shrink-0"
                              style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}
                            >
                              {tradition.phase}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                            {tradition.culture} · {tradition.region}
                          </p>
                        </div>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 shrink-0 mt-1" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                          : <ChevronDown className="w-4 h-4 shrink-0 mt-1" style={{ color: 'hsl(var(--muted-foreground))' }} aria-hidden="true" />
                        }
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                              <p className="text-sm leading-relaxed pt-3" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                                {tradition.description}
                              </p>
                              <div
                                className="p-3 rounded-lg"
                                style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}
                              >
                                <p
                                  className="text-xs font-medium mb-1"
                                  style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                                >
                                  Try This Practice
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                                  {tradition.practice}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs mt-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Traditions are presented respectfully as educational context. Practices are adapted for personal use and do not claim to represent complete ceremonial forms.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GATE F2 — Private Grimoire Note Editor
// ══════════════════════════════════════════════════════════════════════════════

export interface GrimoireNoteEditorProps {
  ritualId: number;
  initialNotes: string;
  onSaved: (notes: string) => void;
}

export function GrimoireNoteEditor({ ritualId, initialNotes, onSaved }: GrimoireNoteEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/moon-rituals/${ritualId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: draft }),
      });
      if (!res.ok) throw new Error('Failed to save notes');
      onSaved(draft);
      setEditing(false);
    } catch {
      setError('Could not save notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div>
        {initialNotes && (
          <div
            className="p-3 rounded-lg mb-2"
            style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
          >
            <p
              className="text-xs mb-1"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              My Notes
            </p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
              {initialNotes}
            </p>
          </div>
        )}
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          <Pencil className="w-3 h-3" aria-hidden="true" />
          {initialNotes ? 'Edit notes' : 'Add personal notes'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <textarea
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
        placeholder="How did this ritual feel? What arose? What would you do differently?"
        rows={4}
        aria-label="Personal ritual notes"
        className="w-full rounded-xl p-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{
          background: 'hsl(var(--muted))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
          fontFamily: 'var(--font-sans)',
        }}
      />
      {error && (
        <p className="text-xs mt-1" style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)' }}>{error}</p>
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          <Check className="w-3 h-3" aria-hidden="true" />
          {saving ? 'Saving…' : 'Save notes'}
        </button>
        <button
          onClick={() => { setEditing(false); setDraft(initialNotes); }}
          className="text-xs px-3 py-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
