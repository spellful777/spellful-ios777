import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import {
  BookOpen, Sparkles, Moon, Leaf, ScrollText, CloudMoon,
  ChevronRight, Check, Plus, Star, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Guest onboarding (unauthenticated visitors) ──────────────────────────────

const INTERESTS = [
  { id: 'tarot',     label: 'Tarot',        icon: ScrollText, color: '--grimoire-tarot', desc: 'Save readings and card interpretations' },
  { id: 'moon',      label: 'Moon Rituals', icon: Moon,       color: '--accent',         desc: 'Track lunar intentions and rituals' },
  { id: 'spells',    label: 'Spellcraft',   icon: Sparkles,   color: '--primary',        desc: 'Record spells and their outcomes' },
  { id: 'herbs',     label: 'Herbalism',    icon: Leaf,       color: '--grimoire-herb',  desc: 'Document herb knowledge and recipes' },
  { id: 'dreams',    label: 'Dream Journal',icon: CloudMoon,  color: '--grimoire-dream', desc: 'Capture dreams and symbols' },
  { id: 'astrology', label: 'Astrology',    icon: BookOpen,   color: '--astro-sun',      desc: 'Track planetary influences' },
];

const GUEST_STEPS = [
  { id: 1, title: 'Welcome to Your Grimoire', subtitle: 'Your personal space for spiritual exploration' },
  { id: 2, title: 'Choose Your Interests',    subtitle: 'What draws you to the craft?' },
  { id: 3, title: 'Your Grimoire Awaits',     subtitle: 'Create a free account to begin' },
];

interface GrimoireOnboardingProps {
  onComplete?: () => void;
}

export function GrimoireOnboarding({ onComplete }: GrimoireOnboardingProps) {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  function toggleInterest(id: string) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20" style={{ background: 'hsl(var(--background))' }}>
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {GUEST_STEPS.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300"
                style={{
                  background: step >= s.id ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                  color: step >= s.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                  border: `1px solid ${step >= s.id ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {step > s.id ? <Check size={14} /> : s.id}
              </div>
              {s.id < GUEST_STEPS.length && (
                <div className="w-8 h-px" style={{ background: step > s.id ? 'hsl(var(--primary))' : 'hsl(var(--border))' }} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
                <BookOpen size={36} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <h1 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                Welcome to Your Grimoire
              </h1>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Your Grimoire is a sacred personal journal for your spiritual journey. Save tarot readings, moon rituals, spells, dreams, and more — all in one beautiful, private space.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                {[
                  { icon: '📖', text: 'Save tarot readings with personal reflections' },
                  { icon: '🌕', text: 'Track moon rituals and lunar intentions' },
                  { icon: '✨', text: 'Record spells and their outcomes' },
                  { icon: '🌿', text: 'Build your personal herb and crystal library' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <span className="text-lg flex-shrink-0">{icon}</span>
                    <span className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{text}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => setStep(2)} className="w-full gap-2 py-3" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
                Begin Your Journey <ChevronRight size={16} />
              </Button>
              <p className="mt-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'hsl(var(--primary))' }}>Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <h2 className="text-3xl mb-2 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                Choose Your Interests
              </h2>
              <p className="text-sm text-center mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                What draws you to the craft? Select all that apply.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {INTERESTS.map(({ id, label, icon: Icon, color, desc }) => {
                  const selected = selectedInterests.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleInterest(id)}
                      className="flex flex-col items-start gap-2 p-4 rounded-xl text-left transition-all duration-200"
                      style={{
                        background: selected ? `hsl(var(${color}) / 0.12)` : 'hsl(var(--card))',
                        border: `1px solid ${selected ? `hsl(var(${color}) / 0.5)` : 'hsl(var(--border))'}`,
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon size={18} style={{ color: `hsl(var(${color}))` }} />
                        {selected && <Check size={14} style={{ color: `hsl(var(${color}))` }} />}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{label}</span>
                      <span className="text-xs leading-snug" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{desc}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 gap-2" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {selectedInterests.length > 0 ? `Continue (${selectedInterests.length} selected)` : 'Skip for now'}
                  <ChevronRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
                <Sparkles size={36} style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <h2 className="text-3xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                Your Grimoire Awaits
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Create a free account to unlock your personal Grimoire and begin saving your spiritual journey. Your entries are private and only visible to you.
              </p>
              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {selectedInterests.map((id) => {
                    const interest = INTERESTS.find((i) => i.id === id);
                    if (!interest) return null;
                    const Icon = interest.icon;
                    return (
                      <span key={id} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs" style={{ background: `hsl(var(${interest.color}) / 0.15)`, color: `hsl(var(${interest.color}))`, border: `1px solid hsl(var(${interest.color}) / 0.3)`, fontFamily: 'var(--font-sans)' }}>
                        <Icon size={12} /> {interest.label}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="space-y-3">
                <Link to="/signup" className="block w-full py-3 rounded-xl font-medium text-center" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Create Free Account
                </Link>
                <Link to="/login" className="block w-full py-3 rounded-xl font-medium text-center" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
                  Sign In to Existing Account
                </Link>
              </div>
              <p className="mt-6 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Free forever. No credit card required. Your data is private.
              </p>
              <button onClick={() => setStep(1)} className="mt-4 text-xs underline" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Start over
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Authenticated first-time welcome flow (5-step modal) ─────────────────────

const WELCOME_KEY = 'spellful-grimoire-welcome-v1';

const WELCOME_STEPS: Array<{
  id: number;
  icon: ReactNode;
  title: string;
  body: string;
  tip?: string;
  cta: string;
}> = [
  {
    id: 1,
    icon: <BookOpen size={40} style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Welcome to Your Grimoire',
    body: 'Your Grimoire is a sacred, private Book of Shadows — a living record of your spiritual practice. Everything you save here is yours alone, visible only to you.',
    tip: 'Think of it as a digital altar for your inner world.',
    cta: 'Next',
  },
  {
    id: 2,
    icon: <Sparkles size={40} style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Set Your Intentions',
    body: 'Before you begin, take a breath. What do you want to cultivate in your practice? Clarity, healing, growth, connection? Your Grimoire will hold whatever you bring to it.',
    tip: 'You can record intentions as Journal entries and revisit them over time.',
    cta: 'Next',
  },
  {
    id: 3,
    icon: <Plus size={40} style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Add Your First Entry',
    body: 'Tap the gold + button to create your first entry. Choose a type — Spell, Herb, Crystal, Ritual, Tarot, Dream, or Journal — then give it a title and write freely.',
    tip: 'There are no rules. Write as much or as little as feels right.',
    cta: 'Next',
  },
  {
    id: 4,
    icon: <Star size={40} style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Explore & Organize',
    body: 'Use the filter bar to browse by type, or search by title and tags. Heart any entry to mark it as a favorite — your starred entries appear in a dedicated view.',
    tip: 'Tags help you find entries later. Try tags like "full moon", "protection", or "rose quartz".',
    cta: 'Next',
  },
  {
    id: 5,
    icon: <Moon size={40} style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Make It Yours',
    body: 'Your Grimoire grows with you. Return after rituals, dreams, or readings. The more you add, the richer your record of your path becomes.',
    tip: 'You can link moon phases, herbs, and crystals across entries to build a connected practice.',
    cta: 'Open My Grimoire',
  },
];

interface GrimoireWelcomeFlowProps {
  onComplete: () => void;
}

export function GrimoireWelcomeFlow({ onComplete }: GrimoireWelcomeFlowProps) {
  const [step, setStep] = useState(0); // 0-indexed internally
  const total = WELCOME_STEPS.length;
  // eslint-disable-next-line security/detect-object-injection
  const current = WELCOME_STEPS[step];

  function handleNext() {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function finish() {
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch { /* storage blocked */ }
    onComplete();
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Grimoire welcome guide"
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ duration: 0.35, ease: 'easeOut' as const }}
        className="relative w-full max-w-md rounded-3xl p-8 pb-10"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 24px 80px hsl(var(--background) / 0.9)',
        }}
      >
        {/* Skip */}
        <button
          onClick={finish}
          className="absolute top-5 right-5 p-1.5 rounded-full transition-colors"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          aria-label="Skip welcome guide"
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--foreground))'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--muted-foreground))'; }}
        >
          <X size={18} />
        </button>

        {/* Step counter */}
        <p
          className="text-xs mb-6"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.12em' }}
        >
          Step {step + 1} of {total}
        </p>

        {/* Progress bar */}
        <div className="w-full h-0.5 rounded-full mb-8 overflow-hidden" style={{ background: 'hsl(var(--border))' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'hsl(var(--primary))' }}
            initial={false}
            animate={{ width: `${((step + 1) / total) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
          />
        </div>

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.25)' }}
        >
          {current.icon}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${step}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            <h2
              className="text-2xl md:text-3xl mb-3 leading-tight"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {current.title}
            </h2>
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {current.body}
            </p>
            {current.tip && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl mb-6"
                style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}
              >
                <Sparkles size={14} className="mt-0.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                  {current.tip}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
                fontFamily: 'var(--font-sans)',
                border: '1px solid hsl(var(--border))',
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px hsl(var(--primary) / 0.35)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
          >
            {current.cta}
            {step < total - 1 && <ChevronRight size={15} />}
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {WELCOME_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? '20px' : '6px',
                height: '6px',
                background: i === step ? 'hsl(var(--primary))' : 'hsl(var(--border))',
              }}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Hook: should we show the welcome flow? ───────────────────────────────────

export function useGrimoireWelcome(isAuthenticated: boolean) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const seen = localStorage.getItem(WELCOME_KEY);
      if (!seen) setShow(true);
    } catch {
      // storage blocked — don't show
    }
  }, [isAuthenticated]);

  function dismiss() {
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch { /* storage blocked */ }
    setShow(false);
  }

  return { show, dismiss };
}
