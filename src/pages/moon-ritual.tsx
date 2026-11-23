import { moon_ritual } from 'virtual:content';
import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import MoonNightSky from '@/components/MoonNightSky';
import TwinkleStars from '@/components/TwinkleStars';
import {
  Sparkles, Save, ChevronDown, ChevronUp, Trash2, Clock,
  BookOpen, Calendar, Flame, Wind, Timer, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/auth-client';
import {
  GuidedRitualMode,
  LunarJourney,
  FolkloreLibrary,
  GrimoireNoteEditor,
} from '@/components/MoonRitualGates';
import {
  MOON_PHASES,
  INTENTIONS,
  getCurrentMoonPhase,
  getRitual,
  getMoonPhaseInfo,
  getIntentionInfo,
  type MoonPhaseKey,
  type IntentionKey,
  type RitualRecommendation,
} from '@/lib/moon-ritual-data';
import {
  getUpcomingPhaseDates,
  type UpcomingPhaseDate,
} from '@/lib/moon-phase-engine';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SavedRitual {
  id: number;
  moonPhase: string;
  intention: string;
  ritualName: string;
  herbs: string[];
  crystals: string[];
  affirmations: string[];
  journalPrompts: string[];
  steps: string[];
  scheduledDate: string;
  notes: string;
  createdAt: string;
}

// ── Flame / smoke detection ──────────────────────────────────────────────────
const FLAME_KEYWORDS = ['candle', 'flame', 'burn', 'incense', 'smoke', 'fire', 'light a'];

function stepHasFlame(step: string): boolean {
  const lower = step.toLowerCase();
  return FLAME_KEYWORDS.some(kw => lower.includes(kw));
}

function smokeFreeStep(step: string): string {
  return step
    .replace(/light(s|ed)? (a |an |the )?(candle|incense)/gi, 'place (or switch on) a battery candle / diffuser')
    .replace(/burn(ing|s|ed)? (the |a |an )?(bay leaf|paper|letter|incense|herbs?)/gi, 'fold and keep (or safely discard) the $3')
    .replace(/candle/gi, 'battery candle')
    .replace(/incense/gi, 'essential oil diffuser')
    .replace(/smoke/gi, 'scent')
    .replace(/flame/gi, 'light');
}

function getQuickSteps(steps: string[]): string[] {
  // Quick mode: first 3 steps + last step (closing action)
  if (steps.length <= 4) return steps;
  return [...steps.slice(0, 3), steps[steps.length - 1]];
}

// ── Moon Phase Wheel ──────────────────────────────────────────────────────────
function MoonPhaseWheel({
  currentPhase,
  selected,
  onSelect,
}: {
  currentPhase: MoonPhaseKey;
  selected: MoonPhaseKey;
  onSelect: (p: MoonPhaseKey) => void;
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
      {MOON_PHASES.map((phase) => {
        const isCurrent = phase.key === currentPhase;
        const isSelected = phase.key === selected;
        return (
          <motion.button
            key={phase.key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(phase.key)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
            style={{
              background: isSelected
                ? 'hsl(var(--primary) / 0.2)'
                : isCurrent
                ? 'hsl(var(--accent) / 0.15)'
                : 'hsl(var(--card))',
              border: `1px solid ${
                isSelected
                  ? 'hsl(var(--primary))'
                  : isCurrent
                  ? 'hsl(var(--accent))'
                  : 'hsl(var(--border))'
              }`,
            }}
          >
            <span className="text-2xl">{phase.glyph}</span>
            <p
              className="text-center leading-tight"
              style={{
                color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.6rem',
              }}
            >
              {phase.name.split(' ').map((w, i) => (
                <span key={i} className="block">{w}</span>
              ))}
            </p>
            {isCurrent && (
              <span
                className="text-xs"
                style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', fontSize: '0.55rem' }}
              >
                Tonight
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Intention Selector ────────────────────────────────────────────────────────
function IntentionSelector({
  selected,
  onSelect,
}: {
  selected: IntentionKey;
  onSelect: (i: IntentionKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {INTENTIONS.map((intention) => {
        const isSelected = intention.key === selected;
        return (
          <motion.button
            key={intention.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(intention.key)}
            className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
            style={{
              background: isSelected ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--card))',
              border: `1px solid ${isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
            }}
          >
            <span className="text-2xl">{intention.icon}</span>
            <p
              className="text-sm font-medium leading-tight"
              style={{
                color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {intention.label}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Ritual Card ───────────────────────────────────────────────────────────────
function RitualCard({
  ritual,
  phase,
  intention,
  onSave,
  saving,
  saved,
  saveError,
  isAuthenticated,
  smokeFree,
  quickMode,
}: {
  ritual: RitualRecommendation;
  phase: MoonPhaseKey;
  intention: IntentionKey;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  saveError: string;
  isAuthenticated: boolean;
  smokeFree: boolean;
  quickMode: boolean;
}) {
  const [openSection, setOpenSection] = useState<string | null>('steps');
  const phaseInfo = getMoonPhaseInfo(phase);
  const intentionInfo = getIntentionInfo(intention);

  const toggle = (section: string) =>
    setOpenSection(prev => (prev === section ? null : section));

  // Apply filters to steps
  const baseSteps = quickMode ? getQuickSteps(ritual.steps) : ritual.steps;
  const displaySteps = smokeFree ? baseSteps.map(s => smokeFreeStep(s)) : baseSteps;
  const hasFlameSteps = ritual.steps.some(stepHasFlame);

  const sections = [
    {
      id: 'steps',
      label: moon_ritual.ritualSection.stepsLabel,
      icon: '📋',
      content: (
        <>
          {smokeFree && hasFlameSteps && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-xs"
              style={{ background: 'hsl(var(--accent) / 0.12)', border: '1px solid hsl(var(--accent) / 0.3)', color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}
            >
              <Wind className="w-3.5 h-3.5 flex-shrink-0" />
              Candles replaced with battery candles · incense replaced with diffuser
            </div>
          )}
          {!smokeFree && hasFlameSteps && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-xs"
              style={{ background: 'hsl(var(--warning) / 0.1)', border: '1px solid hsl(var(--warning) / 0.3)', color: 'hsl(var(--warning))', fontFamily: 'var(--font-sans)' }}
            >
              <Flame className="w-3.5 h-3.5 flex-shrink-0" />
              This ritual uses open flame. Never leave candles unattended. Keep water nearby.
            </div>
          )}
          <ol className="space-y-3">
            {displaySteps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                  {step}
                </p>
              </li>
            ))}
          </ol>
          {quickMode && ritual.steps.length > 4 && (
            <p className="text-xs mt-3 opacity-60" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Showing {displaySteps.length} of {ritual.steps.length} steps · switch to Full ritual for all steps
            </p>
          )}
        </>
      ),
    },
    {
      id: 'affirmations',
      label: moon_ritual.ritualSection.affirmationsLabel,
      icon: '✨',
      content: (
        <div className="space-y-3">
          {ritual.affirmations.map((aff, i) => (
            <div
              key={i}
              className="p-3 rounded-lg italic text-sm"
              style={{
                background: 'hsl(var(--primary) / 0.08)',
                border: '1px solid hsl(var(--primary) / 0.2)',
                color: 'hsl(var(--foreground))',
                fontFamily: 'var(--font-heading)',
                fontSize: '1rem',
              }}
            >
              "{aff}"
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'journal',
      label: moon_ritual.ritualSection.journalLabel,
      icon: '📖',
      content: (
        <div className="space-y-3">
          {ritual.journalPrompts.map((prompt, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 rounded-lg"
              style={{ background: 'hsl(var(--muted))', fontFamily: 'var(--font-sans)' }}
            >
              <span style={{ color: 'hsl(var(--accent))' }}>✦</span>
              <p className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{prompt}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Header */}
      <div
        className="p-6"
        style={{ background: 'linear-gradient(135deg, hsl(var(--card-deep)) 0%, hsl(var(--card)) 100%)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{phaseInfo.glyph}</span>
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {phaseInfo.name} · {intentionInfo.icon} {intentionInfo.label}
              </p>
              <h3
                className="text-2xl md:text-3xl"
                style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
              >
                {ritual.ritualName}
              </h3>
            </div>
          </div>
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          {ritual.description}
        </p>
      </div>

      {/* Quick info row */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-px"
        style={{ background: 'hsl(var(--border))' }}
      >
        {[
          { label: moon_ritual.ritualSection.herbsLabel, items: ritual.herbs, icon: '🌿' },
          { label: moon_ritual.ritualSection.crystalsLabel, items: ritual.crystals, icon: '💎' },
          { label: moon_ritual.ritualSection.candleLabel, items: [ritual.candle], icon: '🕯️' },
          { label: moon_ritual.ritualSection.bestTimeLabel, items: [ritual.bestTime], icon: '🌙' },
        ].map((col) => (
          <div
            key={col.label}
            className="p-4"
            style={{ background: 'hsl(var(--card))' }}
          >
            <p
              className="text-xs mb-2 font-semibold"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              {col.icon} {col.label}
            </p>
            <div className="flex flex-wrap gap-1">
              {col.items.map((item) => (
                <span
                  key={item}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--foreground))',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Accordion sections */}
      <div className="p-6 space-y-3">
        {sections.map((section) => {
          const isOpen = openSection === section.id;
          return (
            <div
              key={section.id}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid hsl(var(--border))' }}
            >
              <button
                className="w-full flex items-center justify-between p-4"
                onClick={() => toggle(section.id)}
              >
                <span
                  className="font-semibold text-sm"
                  style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)', fontSize: '1rem' }}
                >
                  {section.icon} {section.label}
                </span>
                {isOpen
                  ? <ChevronUp className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                }
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-4 pb-4"
                      style={{ borderTop: '1px solid hsl(var(--border))' }}
                    >
                      <div className="pt-4">{section.content}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Save actions */}
      <div
        className="px-6 pb-6 flex flex-wrap items-center gap-3"
        style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}
      >
        {isAuthenticated ? (
          <Button
            onClick={onSave}
            disabled={saving || saved}
            className="gap-2"
            style={{
              background: saved ? 'hsl(var(--success))' : 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            {saved ? <BookOpen className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving
              ? moon_ritual.ritualSection.savingText
              : saved
              ? moon_ritual.ritualSection.savedText
              : moon_ritual.ritualSection.saveButton}
          </Button>
        ) : (
          <p
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
          >
            {moon_ritual.ritualSection.loginToSave}
          </p>
        )}
        {saveError && (
          <p className="text-xs" style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)' }}>
            {saveError}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Saved Rituals History ─────────────────────────────────────────────────────
function SavedRituals({
  rituals,
  onDelete,
  onUpdateNotes,
}: {
  rituals: SavedRitual[];
  onDelete: (id: number) => void;
  onUpdateNotes: (id: number, notes: string) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (rituals.length === 0) {
    return (
      <p
        className="text-center py-8"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
      >
        {moon_ritual.historySection.emptyText}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rituals.map((ritual) => {
        const isOpen = expanded === ritual.id;
        const phaseInfo = MOON_PHASES.find(p => p.key === ritual.moonPhase);
        const intentionInfo = INTENTIONS.find(i => i.key === ritual.intention);
        const date = new Date(ritual.createdAt).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        });

        return (
          <div
            key={ritual.id}
            className="rounded-xl overflow-hidden"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <button
              className="w-full flex items-center justify-between p-4 text-left"
              onClick={() => setExpanded(isOpen ? null : ritual.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{phaseInfo?.glyph ?? '🌙'}</span>
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
                  >
                    {ritual.ritualName}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                  >
                    {date} · {intentionInfo?.icon} {intentionInfo?.label}
                    {ritual.scheduledDate && (
                      <span className="ml-2" style={{ color: 'hsl(var(--accent))' }}>
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {moon_ritual.historySection.scheduledLabel} {ritual.scheduledDate}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(ritual.id); }}
                  className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: 'hsl(var(--destructive))' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {isOpen
                  ? <ChevronUp className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                }
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div
                    className="px-4 pb-4 space-y-4"
                    style={{ borderTop: '1px solid hsl(var(--border))' }}
                  >
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div>
                        <p
                          className="text-xs mb-1 font-semibold"
                          style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                        >
                          🌿 Herbs
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {ritual.herbs.map(h => (
                            <span key={h} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{h}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p
                          className="text-xs mb-1 font-semibold"
                          style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                        >
                          💎 Crystals
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {ritual.crystals.map(c => (
                            <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {ritual.affirmations.length > 0 && (
                      <div>
                        <p
                          className="text-xs mb-2 font-semibold"
                          style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                        >
                          ✨ Affirmations
                        </p>
                        {ritual.affirmations.map((aff, i) => (
                          <p key={i} className="text-sm italic mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-heading)', fontSize: '0.9rem' }}>
                            "{aff}"
                          </p>
                        ))}
                      </div>
                    )}
                    {/* Gate F2: Personal Grimoire Notes */}
                    <div>
                      <p
                        className="text-xs mb-2 font-semibold"
                        style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                      >
                        📖 My Grimoire Notes
                      </p>
                      <GrimoireNoteEditor
                        ritualId={ritual.id}
                        initialNotes={ritual.notes ?? ''}
                        onSaved={(notes) => onUpdateNotes(ritual.id, notes)}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MoonRitualPage() {
  const { isAuthenticated } = useSession();

  // Current moon
  const moonData = getCurrentMoonPhase();
  const currentPhase = moonData.phase;
  const currentPhaseInfo = getMoonPhaseInfo(currentPhase);

  // State
  const [selectedPhase, setSelectedPhase] = useState<MoonPhaseKey>(currentPhase);
  const [selectedIntention, setSelectedIntention] = useState<IntentionKey>('love');
  const [showRitual, setShowRitual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedRituals, setSavedRituals] = useState<SavedRitual[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [smokeFree, setSmokeFree] = useState(false);
  const [quickMode, setQuickMode] = useState(false);
  const [guidedMode, setGuidedMode] = useState(false);

  // Upcoming phase dates — computed once on mount
  const upcomingPhases: UpcomingPhaseDate[] = getUpcomingPhaseDates();

  const ritual = getRitual(selectedPhase, selectedIntention);
  const phaseInfo = getMoonPhaseInfo(selectedPhase);

  const handleReveal = () => {
    setShowRitual(true);
    setSaved(false);
    setSaveError('');
  };

  const handlePhaseChange = (phase: MoonPhaseKey) => {
    setSelectedPhase(phase);
    setShowRitual(false);
    setSaved(false);
  };

  const handleIntentionChange = (intention: IntentionKey) => {
    setSelectedIntention(intention);
    setShowRitual(false);
    setSaved(false);
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/moon-rituals', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as SavedRitual[];
        setSavedRituals(data);
        setHistoryLoaded(true);
      }
    } catch {
      // silent
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated || !ritual) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/moon-rituals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          moonPhase: selectedPhase,
          intention: selectedIntention,
          ritualName: ritual.ritualName,
          herbs: ritual.herbs,
          crystals: ritual.crystals,
          affirmations: ritual.affirmations,
          journalPrompts: ritual.journalPrompts,
          steps: ritual.steps,
          scheduledDate: '',
          notes: '',
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      if (showHistory) void loadHistory();
    } catch {
      setSaveError('Could not save ritual. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGuidedComplete = async (_completedAt: string) => {
    // Auto-save to Grimoire on guided completion if authenticated
    if (isAuthenticated && !saved) {
      void handleSave();
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory && !historyLoaded) void loadHistory();
    setShowHistory(v => !v);
  };

  const handleJourneySelect = (phase: MoonPhaseKey, intention: IntentionKey) => {
    handlePhaseChange(phase);
    setSelectedIntention(intention);
    // Scroll to intention selector
    setTimeout(() => {
      document.getElementById('intention-selector-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleUpdateNotes = (id: number, notes: string) => {
    setSavedRituals(prev => prev.map(r => r.id === id ? { ...r, notes } : r));
  };

  const handleDeleteRitual = async (id: number) => {
    try {
      await fetch(`/api/moon-rituals/${id}`, { method: 'DELETE', credentials: 'include' });
      setSavedRituals(prev => prev.filter(r => r.id !== id));
    } catch {
      // silent
    }
  };

  return (
    <>
      <Helmet>
        <title>{moon_ritual.seo.title}</title>
        <meta name="description" content={moon_ritual.seo.description} />
        <meta property="og:title" content={moon_ritual.seo.title} />
        <meta property="og:description" content={moon_ritual.seo.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/moon-ritual" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={moon_ritual.seo.title} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={moon_ritual.seo.title} />
        <meta name="twitter:description" content={moon_ritual.seo.description} />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content={moon_ritual.seo.title} />
        <link rel="canonical" href="https://spellful.com/moon-ritual" />
      </Helmet>

      <main>
        {/* ── Hero ── */}
        <section
          className="relative py-24 text-center overflow-hidden"
          style={{ background: `linear-gradient(180deg, hsl(var(--card-deep)) 0%, hsl(var(--background)) 100%)` }}
        >
          <MoonNightSky moonPosition="top-left" moonSize={68} opacity={0.6} shootingStars={true} />
          <TwinkleStars count={32} opacity={0.45} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 max-w-2xl mx-auto px-6"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-6"
              style={{
                background: 'hsl(var(--astro-moon) / 0.15)',
                border: '1px solid hsl(var(--astro-moon) / 0.4)',
                color: 'hsl(var(--astro-moon))',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Sparkles className="w-3 h-3" />
              {moon_ritual.hero.eyebrow}
            </div>
            <h1
              className="text-5xl md:text-6xl mb-4"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
            >
              {moon_ritual.hero.title}
            </h1>
            <p
              className="text-lg"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {moon_ritual.hero.subtitle}
            </p>
          </motion.div>
        </section>

        <div className="max-w-4xl mx-auto px-6 pb-20 space-y-10">

          {/* ── Tonight's Moon ── */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6 md:p-8"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <h2
              className="text-2xl mb-6"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
            >
              {moon_ritual.phaseSection.heading}
            </h2>

            {/* Current phase display */}
            <div className="flex items-center gap-6 mb-6 p-4 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
              <span className="text-5xl">{currentPhaseInfo.glyph}</span>
              <div>
                <p
                  className="text-2xl mb-1"
                  style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
                >
                  {currentPhaseInfo.name}
                </p>
                <p
                  className="text-sm mb-2"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  {moonData.age} {moon_ritual.phaseSection.ageLabel} · {moonData.illumination}% {moon_ritual.phaseSection.illuminationLabel}
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}
                >
                  {currentPhaseInfo.energy}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {currentPhaseInfo.keywords.map(kw => (
                    <span
                      key={kw}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming phase dates */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {upcomingPhases.map((p) => (
                <div
                  key={p.phase}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl text-center"
                  style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
                >
                  <span className="text-xl">{p.glyph}</span>
                  <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                    {p.phase}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                    {p.label}
                  </p>
                  <p className="text-xs opacity-60" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {p.daysAway === 0 ? 'Today' : p.daysAway === 1 ? 'Tomorrow' : 'in ' + p.daysAway + 'd'}
                  </p>
                </div>
              ))}
            </div>

            {/* How We Calculate This */}
            <div className="flex justify-end mt-2 mb-4">
              <Link
                to="/astronomical-accuracy#moon-phases"
                className="text-xs underline opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                How we calculate this →
              </Link>
            </div>

            {/* Phase wheel — select a different phase */}
            <p
              className="text-xs mb-3"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              Or select a different phase to explore:
            </p>
            <MoonPhaseWheel
              currentPhase={currentPhase}
              selected={selectedPhase}
              onSelect={handlePhaseChange}
            />

            {selectedPhase !== currentPhase && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 rounded-lg"
                style={{ background: 'hsl(var(--accent) / 0.1)', border: '1px solid hsl(var(--accent) / 0.3)' }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}
                >
                  Viewing rituals for <strong>{phaseInfo.name}</strong> — {phaseInfo.energy}
                </p>
              </motion.div>
            )}
          </motion.section>

          {/* ── Intention Selector ── */}
          <motion.section
            id="intention-selector-section"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-6 md:p-8"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <h2
              className="text-2xl mb-2"
              style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
            >
              {moon_ritual.intentionSection.heading}
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {moon_ritual.intentionSection.subheading}
            </p>
            <IntentionSelector selected={selectedIntention} onSelect={handleIntentionChange} />

            {/* Ritual filters */}
            <div className="flex flex-wrap gap-2 mt-4 mb-2">
              <button
                onClick={() => setSmokeFree(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: smokeFree ? 'hsl(var(--accent) / 0.2)' : 'hsl(var(--muted))',
                  border: smokeFree ? '1px solid hsl(var(--accent))' : '1px solid hsl(var(--border))',
                  color: smokeFree ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Wind className="w-3 h-3" />
                Smoke-free / flame-free
              </button>
              <button
                onClick={() => setQuickMode(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: quickMode ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted))',
                  border: quickMode ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                  color: quickMode ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {quickMode ? <Zap className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                {quickMode ? 'Quick (~10 min)' : 'Full ritual (~30 min)'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <Button
                onClick={handleReveal}
                size="lg"
                className="gap-2 px-10"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                <Sparkles className="w-4 h-4" />
                Reveal My Ritual
              </Button>
            </div>
          </motion.section>

          {/* ── Ritual Card ── */}
          <AnimatePresence mode="wait">
            {showRitual && ritual && (
              <RitualCard
                key={selectedPhase + '-' + selectedIntention + '-' + (smokeFree ? 'sf' : '') + (quickMode ? 'q' : '')}
                ritual={ritual}
                phase={selectedPhase}
                intention={selectedIntention}
                onSave={handleSave}
                saving={saving}
                saved={saved}
                saveError={saveError}
                isAuthenticated={isAuthenticated}
                smokeFree={smokeFree}
                quickMode={quickMode}
              />
            )}
          </AnimatePresence>

          {/* ── Gate D: Guided Ritual Mode ── */}
          {showRitual && !guidedMode && (
            <div className="flex justify-center">
              <button
                onClick={() => setGuidedMode(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--primary) / 0.4)',
                  color: 'hsl(var(--primary))',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                🕯️ Begin Guided Ritual
              </button>
            </div>
          )}

          <AnimatePresence>
            {guidedMode && showRitual && ritual && (
              <GuidedRitualMode
                key={selectedPhase + '-' + selectedIntention + '-guided'}
                ritual={ritual}
                smokeFree={smokeFree}
                onComplete={handleGuidedComplete}
                onExit={() => setGuidedMode(false)}
              />
            )}
          </AnimatePresence>

          {/* ── Gate E: Lunar Journey ── */}
          <LunarJourney
            upcomingPhases={upcomingPhases}
            onSelectPhaseIntention={handleJourneySelect}
          />

          {/* ── Gate F1: Folklore Library ── */}
          <FolkloreLibrary />

          {/* ── Saved Rituals ── */}
          {isAuthenticated && (
            <section>
              <button
                onClick={handleToggleHistory}
                className="w-full flex items-center justify-between p-4 rounded-xl mb-4"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                  <h2
                    className="text-xl"
                    style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
                  >
                    {moon_ritual.historySection.heading}
                  </h2>
                </div>
                {showHistory
                  ? <ChevronUp className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                }
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <SavedRituals rituals={savedRituals} onDelete={handleDeleteRitual} onUpdateNotes={handleUpdateNotes} />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
