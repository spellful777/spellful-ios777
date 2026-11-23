import { Helmet } from '@dr.pogodin/react-helmet';
import { herbs as herbsContent } from 'virtual:content';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Seeded stars (SSR-safe) ──────────────────────────────────────────────────
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
const HERO_STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  top: `${seededRand(i * 3) * 100}%`,
  left: `${seededRand(i * 3 + 1) * 100}%`,
  size: seededRand(i * 3 + 2) * 2.2 + 0.6,
  duration: 2.5 + seededRand(i * 7) * 5,
  delay: seededRand(i * 11) * 6,
  color: i % 7 === 0 ? 'hsl(var(--primary))' : i % 5 === 0 ? 'hsl(var(--accent))' : 'hsl(var(--foreground))',
  glow: i % 9 === 0,
}));

// ── Types ────────────────────────────────────────────────────────────────────
type Herb = {
  id: number;
  name: string;
  aliases: string;
  category: string;
  element: string;
  planet: string;
  zodiac: string;
  magicalUses: string;
  spellTypes: string;
  bestTiming: string;
  moonPhase: string;
  notes: string;
  spellComponents: string;
  botanicalName: string;
  plantFamily: string;
  plantPart: string;
  region: string;
  identityWarning: string | null;
  safetyNotes: string | null;
  pregnancyCaution: boolean;
  petToxicity: boolean;
  drugInteractions: string | null;
  ingestionWarning: string | null;
  smokeWarning: string | null;
  topicalWarning: string | null;
  sourceLabel: string;
  citationUrl: string;
  lastVerifiedDate: string;
  traditionAttribution: string | null;
  correspondenceProvenance: string | null;
  status: string;
};

type Candle = {
  id: number;
  color: string;
  hex: string;
  element: string;
  planet: string;
  zodiac: string;
  magicalUses: string;
  spellTypes: string;
  bestTiming: string;
  moonPhase: string;
  spellRecipe: string;
  notes: string;
};

// ── Constants ────────────────────────────────────────────────────────────────
const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/herbs`;

// Element color uses CSS variables
function elementColor(element: string): string {
  const map: Record<string, string> = {
    Fire: 'hsl(var(--primary))',
    Water: 'hsl(var(--herb-water))',
    Earth: 'hsl(var(--herb-earth))',
    Air: 'hsl(var(--herb-air))',
    'All Elements': 'hsl(var(--accent))',
  };
  return map[element] ?? 'hsl(var(--primary))';
}

const SPELL_TYPES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All spell types' },
  { value: 'protection', label: 'Protection' },
  { value: 'love', label: 'Love & Relationships' },
  { value: 'abundance', label: 'Abundance & Prosperity' },
  { value: 'healing', label: 'Healing & Wellness' },
  { value: 'divination', label: 'Divination' },
  { value: 'cleansing', label: 'Cleansing & Purification' },
  { value: 'manifestation', label: 'Manifestation' },
];

const LEARNING_PATHS: Array<{ icon: string; level: string; title: string; colorVar: string; paragraphs: string[] }> = [
  {
    icon: '🌱', level: 'Beginner', title: 'Introduction to Magical Herbalism', colorVar: '--secondary',
    paragraphs: [
      'Start with the basics of plant identification, safety, and the concept of magical correspondences. Learn why certain herbs are associated with specific intentions and how to work with them respectfully.',
      'Focus on 5–10 common herbs: lavender, rosemary, chamomile, mint, and rose. Understand their dual botanical and magical identities before expanding your practice.',
    ],
  },
  {
    icon: '🌿', level: 'Intermediate', title: 'Planetary & Elemental Correspondences', colorVar: '--primary',
    paragraphs: [
      'Deepen your practice by exploring the classical system of planetary rulerships (Culpeper, Agrippa) and elemental associations. Understand how Fire, Water, Earth, and Air herbs differ in energy and application.',
      'Learn to craft simple herbal bundles, sachets, and infusions aligned with moon phases and seasonal cycles.',
    ],
  },
  {
    icon: '🔮', level: 'Advanced', title: 'Source-Critical Magical Herbalism', colorVar: '--accent',
    paragraphs: [
      'Develop a discerning practice by tracing claims to their sources. Distinguish between historically documented uses, modern neo-pagan innovations, and unsupported assertions.',
      'Explore the tension between traditional folk medicine and contemporary evidence-based herbalism. Learn to hold both perspectives with integrity.',
    ],
  },
];


type SourceLabelConfig = { color: string; bg: string; icon: string; description: string };

function sourceLabelConfig(label: string): SourceLabelConfig {
  const map: Record<string, SourceLabelConfig> = {
    'VERIFIED BOTANICAL FACT': {
      color: 'hsl(var(--herb-verified))',
      bg: 'hsl(var(--herb-verified) / 0.12)',
      icon: '✓',
      description: 'Confirmed by botanical taxonomy sources (e.g. Kew Plants of the World Online)',
    },
    'DOCUMENTED HISTORICAL USE': {
      color: 'hsl(var(--herb-historical))',
      bg: 'hsl(var(--herb-historical) / 0.12)',
      icon: '📜',
      description: 'Attested in historical herbalism texts, ethnobotany, or primary sources',
    },
    'TRADITIONAL CORRESPONDENCE': {
      color: 'hsl(var(--accent))',
      bg: 'hsl(var(--accent) / 0.12)',
      icon: '✦',
      description: 'Magical association from documented folk or occult tradition — symbolic, not scientific',
    },
    'UNVERIFIED': {
      color: 'hsl(var(--muted-foreground))',
      bg: 'hsl(var(--muted) / 0.5)',
      icon: '?',
      description: 'Editorial convention — no primary source located',
    },
  };
  return map[label] ?? map['UNVERIFIED'];
}

// ── Correspondence Explorer data ─────────────────────────────────────────────
const INTENTIONS = [
  { value: 'love spell', label: 'Love & Romance', icon: '♥', colorVar: '--herb-venus' },
  { value: 'protection', label: 'Protection', icon: '⚔', colorVar: '--herb-water' },
  { value: 'money', label: 'Prosperity', icon: '✦', colorVar: '--herb-verified' },
  { value: 'healing', label: 'Healing', icon: '✿', colorVar: '--herb-healing' },
  { value: 'psychic', label: 'Psychic & Divination', icon: '◉', colorVar: '--accent' },
  { value: 'purification', label: 'Purification', icon: '☽', colorVar: '--herb-moon' },
  { value: 'manifestation', label: 'Manifestation', icon: '★', colorVar: '--primary' },
  { value: 'shadow work', label: 'Shadow Work', icon: '◆', colorVar: '--herb-shadow' },
  { value: 'grounding', label: 'Grounding', icon: '⊕', colorVar: '--herb-earth' },
  { value: 'dreams', label: 'Dreams & Sleep', icon: '☾', colorVar: '--herb-dreams' },
];

// ── Seasonal data ─────────────────────────────────────────────────────────────
function getCurrentSeason(): { name: string; dateRange: string; herbs: string[]; sabbat: string | null } {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return {
    name: 'Spring', dateRange: 'March – May',
    herbs: ['Violet', 'Dandelion Root', 'Hawthorn', 'Elderflower', 'Vervain', 'Calendula'],
    sabbat: month === 2 ? 'Ostara (Spring Equinox)' : month === 4 ? 'Beltane (May 1)' : null,
  };
  if (month >= 5 && month <= 7) return {
    name: 'Summer', dateRange: 'June – August',
    herbs: ['St. John\'s Wort', 'Lavender', 'Chamomile', 'Rosemary', 'Yarrow', 'Basil'],
    sabbat: month === 5 ? 'Litha (Summer Solstice)' : month === 7 ? 'Lughnasadh (Aug 1)' : null,
  };
  if (month >= 8 && month <= 10) return {
    name: 'Autumn', dateRange: 'September – November',
    herbs: ['Mugwort', 'Wormwood', 'Valerian Root', 'Sage', 'Myrrh', 'Frankincense'],
    sabbat: month === 8 ? 'Mabon (Autumn Equinox)' : month === 9 ? 'Samhain (Oct 31)' : null,
  };
  return {
    name: 'Winter', dateRange: 'December – February',
    herbs: ['Mistletoe', 'Cedar', 'Frankincense', 'Myrrh', 'Cinnamon', 'Rosemary'],
    sabbat: month === 11 ? 'Yule (Winter Solstice)' : month === 1 ? 'Imbolc (Feb 1)' : null,
  };
}

// ── Icons ────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ── Source label badge ────────────────────────────────────────────────────────
function SourceBadge({ label }: { label: string }) {
  const cfg = sourceLabelConfig(label);
  return (
    <span title={cfg.description} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full cursor-help"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`, fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
      <span>{cfg.icon}</span>
      <span>{label}</span>
    </span>
  );
}

// ── Safety warning block ──────────────────────────────────────────────────────
function SafetyLens({ herb }: { herb: Herb }) {
  const warnings = [
    herb.pregnancyCaution && { icon: '🤰', label: 'Pregnancy caution', detail: herb.ingestionWarning ?? 'Avoid during pregnancy. Consult a healthcare provider.' },
    herb.petToxicity && { icon: '🐾', label: 'Pet toxicity', detail: 'May be toxic to cats, dogs, or other pets. Keep out of reach of animals.' },
    herb.drugInteractions && { icon: '💊', label: 'Drug interactions', detail: herb.drugInteractions },
    herb.ingestionWarning && !herb.pregnancyCaution && { icon: '⚠', label: 'Ingestion warning', detail: herb.ingestionWarning },
    herb.smokeWarning && { icon: '💨', label: 'Smoke / inhalation', detail: herb.smokeWarning },
    herb.topicalWarning && { icon: '🖐', label: 'Topical use', detail: herb.topicalWarning },
    herb.identityWarning && { icon: '🔍', label: 'Identity warning', detail: herb.identityWarning },
  ].filter(Boolean) as { icon: string; label: string; detail: string }[];

  if (!warnings.length && !herb.safetyNotes) return null;

  const isHighRisk = herb.pregnancyCaution || herb.petToxicity || !!herb.drugInteractions ||
    (herb.ingestionWarning?.toUpperCase().includes('TOXIC') ?? false);

  return (
    <div className="rounded-xl p-4 mb-5"
      style={{
        background: isHighRisk ? 'hsl(var(--herb-warning) / 0.07)' : 'hsl(var(--herb-historical) / 0.07)',
        border: `1px solid ${isHighRisk ? 'hsl(var(--herb-warning) / 0.3)' : 'hsl(var(--herb-historical) / 0.3)'}`,
      }}>
      <p className="text-xs font-semibold mb-3 flex items-center gap-1.5"
        style={{ color: isHighRisk ? 'hsl(var(--herb-warning))' : 'hsl(var(--herb-historical))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        <AlertIcon /> Safety Lens
      </p>
      {herb.safetyNotes && (
        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{herb.safetyNotes}</p>
      )}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {warnings.map((w) => (
            <div key={w.label} className="flex gap-2 text-xs" style={{ fontFamily: 'var(--font-sans)' }}>
              <span className="shrink-0 mt-0.5">{w.icon}</span>
              <div>
                <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{w.label}: </span>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>{w.detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs mt-3 italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
        This is not medical advice. Consult a qualified healthcare provider for health decisions.
      </p>
    </div>
  );
}

// ── Report error form ─────────────────────────────────────────────────────────
function ReportErrorForm({ herbId, herbName, onClose }: { herbId: number; herbName: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await fetch('/api/herbs/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ herbId, reason, details }),
      });
      setSubmitted(true);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  if (submitted) return (
    <div className="text-center py-6">
      <p className="text-2xl mb-2">✓</p>
      <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>Thank you — your report has been submitted for editorial review.</p>
      <button onClick={onClose} className="mt-4 text-xs px-4 py-2 rounded-full"
        style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>Close</button>
    </div>
  );

  return (
    <div>
      <h3 className="text-lg mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Report an error</h3>
      <p className="text-xs mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Reporting: <strong>{herbName}</strong></p>
      <div className="mb-3">
        <label className="text-xs mb-1 block" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Type of error *</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm"
          style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
          <option value="">Select a reason…</option>
          <option value="incorrect_botanical">Incorrect botanical name or taxonomy</option>
          <option value="incorrect_safety">Incorrect or missing safety information</option>
          <option value="incorrect_correspondence">Incorrect magical correspondence</option>
          <option value="cultural_attribution">Cultural attribution concern</option>
          <option value="broken_citation">Broken or incorrect citation</option>
          <option value="duplicate">Duplicate entry</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="text-xs mb-1 block" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Details (optional)</label>
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Describe the error and, if possible, provide a source…"
          className="w-full rounded-lg px-3 py-2 text-sm resize-none"
          style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }} />
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={!reason || loading}
          className="flex-1 py-2 rounded-full text-sm"
          style={{
            background: reason ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
            color: reason ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
            fontFamily: 'var(--font-sans)',
            cursor: reason ? 'pointer' : 'not-allowed',
          }}>
          {loading ? 'Submitting…' : 'Submit Report'}
        </button>
        <button onClick={onClose} className="px-4 py-2 rounded-full text-sm"
          style={{ background: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--border))' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Herb detail modal ─────────────────────────────────────────────────────────
function HerbDetailModal({ herb, onClose, onSpellTypeClick }: {
  herb: Herb;
  onClose: () => void;
  onSpellTypeClick: (t: string) => void;
}) {
  const [showReport, setShowReport] = useState(false);
  const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [traditionOpen, setTraditionOpen] = useState(false);
  const cfg = sourceLabelConfig(herb.sourceLabel || 'TRADITIONAL CORRESPONDENCE');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.3)', boxShadow: '0 0 60px hsl(var(--primary) / 0.12)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full z-10"
          style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--background))' }}>
          <CloseIcon />
        </button>

        {showReport ? (
          <ReportErrorForm herbId={herb.id} herbName={herb.name} onClose={() => setShowReport(false)} />
        ) : (
          <>
            {/* Header */}
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--border))' }}>{herb.category}</span>
                {herb.element && <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'hsl(var(--primary) / 0.1)', color: elementColor(herb.element), fontFamily: 'var(--font-sans)' }}>◈ {herb.element}</span>}
                <SourceBadge label={herb.sourceLabel || 'TRADITIONAL CORRESPONDENCE'} />
              </div>
              <h2 className="text-4xl mt-2 mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{herb.name}</h2>
              {herb.aliases && <p className="text-sm italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{herb.aliases}</p>}
            </div>

            {/* Botanical identity */}
            {(herb.botanicalName || herb.plantFamily || herb.plantPart || herb.region) && (
              <div className="rounded-xl p-4 mb-5" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-xs mb-3 font-semibold" style={{ color: 'hsl(var(--herb-verified))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>✓ Botanical Identity</p>
                <div className="grid grid-cols-2 gap-2">
                  {herb.botanicalName && (
                    <div className="col-span-2">
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Scientific name</p>
                      <p className="text-sm italic" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{herb.botanicalName}</p>
                    </div>
                  )}
                  {herb.plantFamily && (
                    <div>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Family</p>
                      <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{herb.plantFamily}</p>
                    </div>
                  )}
                  {herb.plantPart && (
                    <div>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Part used</p>
                      <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{herb.plantPart}</p>
                    </div>
                  )}
                  {herb.region && (
                    <div className="col-span-2">
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Origin / region</p>
                      <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{herb.region}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Identity warning */}
            {herb.identityWarning && (
              <div className="rounded-xl p-4 mb-5" style={{ background: 'hsl(var(--herb-historical) / 0.07)', border: '1px solid hsl(var(--herb-historical) / 0.3)' }}>
                <p className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: 'hsl(var(--herb-historical))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  <AlertIcon /> Identity Warning
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{herb.identityWarning}</p>
              </div>
            )}

            {/* Safety lens */}
            <SafetyLens herb={herb} />

            {/* Correspondences grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[{ label: 'Planet', value: herb.planet }, { label: 'Zodiac', value: herb.zodiac }, { label: 'Best Timing', value: herb.bestTiming }, { label: 'Moon Phase', value: herb.moonPhase }]
                .filter((r) => r.value).map((row) => (
                  <div key={row.label} className="rounded-xl p-3" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                    <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{row.label}</p>
                    <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{row.value}</p>
                  </div>
                ))}
            </div>

            {/* Magical uses */}
            <div className="mb-5">
              <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Magical Uses</p>
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{herb.magicalUses}</p>
            </div>

            {/* Spell components */}
            {herb.spellComponents && (
              <div className="mb-5 rounded-xl p-4" style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                <p className="text-xs mb-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Spell Components</p>
                <div className="flex flex-wrap gap-2">
                  {herb.spellComponents.split(',').map((c) => (
                    <span key={c} className="text-xs px-2 py-1 rounded-full" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--border))' }}>{c.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Spell types */}
            <div className="mb-5">
              <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intentions</p>
              <div className="flex flex-wrap gap-2">
                {herb.spellTypes.split(',').map((t) => (
                  <button key={t} onClick={() => { onSpellTypeClick(t.trim()); onClose(); }}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                    {t.trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Tradition & Folklore Atlas */}
            {herb.traditionAttribution && (
              <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                <button onClick={() => setTraditionOpen(!traditionOpen)}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                  <span className="text-xs font-semibold" style={{ color: 'hsl(var(--herb-historical))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>📜 Tradition & Folklore</span>
                  <ChevronIcon open={traditionOpen} />
                </button>
                {traditionOpen && (
                  <div className="px-4 pb-4 pt-2" style={{ background: 'hsl(var(--background))' }}>
                    <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Traditions</p>
                    <p className="text-sm mb-3 leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{herb.traditionAttribution}</p>
                    <p className="text-xs italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                      Cultural practices vary widely. This information is provided for educational purposes. Respect the living traditions of communities whose practices are described here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Why this match? */}
            {herb.correspondenceProvenance && (
              <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                <button onClick={() => setProvenanceOpen(!provenanceOpen)}
                  className="w-full flex items-center justify-between px-4 py-3"
                  style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                  <span className="text-xs font-semibold" style={{ color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>✦ Why this match?</span>
                  <ChevronIcon open={provenanceOpen} />
                </button>
                {provenanceOpen && (
                  <div className="px-4 pb-4 pt-2" style={{ background: 'hsl(var(--background))' }}>
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{herb.correspondenceProvenance}</p>
                    {herb.citationUrl && (
                      <a href={herb.citationUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs mt-2 inline-block"
                        style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                        View source →
                      </a>
                    )}
                    {herb.lastVerifiedDate && (
                      <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Last reviewed: {herb.lastVerifiedDate}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Practitioner notes */}
            {herb.notes && (
              <div className="rounded-xl p-4 mb-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-xs mb-1" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Practitioner Notes</p>
                <p className="text-sm leading-relaxed italic" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{herb.notes}</p>
              </div>
            )}

            {/* Report error */}
            <button onClick={() => setShowReport(true)}
              className="w-full text-xs py-2 rounded-full mt-2"
              style={{ background: 'transparent', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--border))' }}>
              ⚑ Report an error
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Candle detail modal ───────────────────────────────────────────────────────
function CandleDetailModal({ candle, onClose, onSpellTypeClick }: {
  candle: Candle;
  onClose: () => void;
  onSpellTypeClick: (t: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl p-8"
        style={{ background: 'hsl(var(--card))', border: `1px solid ${candle.hex}55`, boxShadow: `0 0 60px ${candle.hex}22` }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--background))' }}>
          <CloseIcon />
        </button>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0"
            style={{ background: candle.hex, boxShadow: `0 0 32px ${candle.hex}88` }}>🕯</div>
          <div>
            <h2 className="text-4xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{candle.color}</h2>
            {candle.element && <p className="text-sm" style={{ color: elementColor(candle.element), fontFamily: 'var(--font-sans)' }}>◈ {candle.element} · {candle.planet}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{ label: 'Zodiac', value: candle.zodiac }, { label: 'Best Timing', value: candle.bestTiming }, { label: 'Moon Phase', value: candle.moonPhase }]
            .filter((r) => r.value).map((row) => (
              <div key={row.label} className="rounded-xl p-3" style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
                <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{row.label}</p>
                <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{row.value}</p>
              </div>
            ))}
        </div>
        <div className="mb-5">
          <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Magical Uses</p>
          <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{candle.magicalUses}</p>
        </div>
        {candle.spellRecipe && (
          <div className="mb-5 rounded-xl p-5" style={{ background: 'hsl(var(--background))', border: `1px solid ${candle.hex}33` }}>
            <p className="text-xs mb-3" style={{ color: candle.hex, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Spell Recipe</p>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{candle.spellRecipe}</p>
          </div>
        )}
        <div className="mb-5">
          <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Spell Types</p>
          <div className="flex flex-wrap gap-2">
            {candle.spellTypes.split(',').map((t) => (
              <button key={t} onClick={() => { onSpellTypeClick(t.trim()); onClose(); }}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: candle.hex + '22', color: candle.hex, fontFamily: 'var(--font-sans)', border: `1px solid ${candle.hex}44` }}>
                {t.trim()}
              </button>
            ))}
          </div>
        </div>
        {candle.notes && (
          <div className="rounded-xl p-4" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <p className="text-xs mb-1" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Practitioner Notes</p>
            <p className="text-sm leading-relaxed italic" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{candle.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Compare panel ─────────────────────────────────────────────────────────────
function ComparePanel({ ids, onClose }: { ids: number[]; onClose: () => void }) {
  const [compareHerbs, setCompareHerbs] = useState<Herb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length < 2) return;
    setLoading(true);
    fetch(`/api/herbs/compare?ids=${ids.join(',')}`)
      .then((r) => r.json() as Promise<{ results: Herb[] }>)
      .then((d) => { setCompareHerbs(d.results); setLoading(false); })
      .catch(() => setLoading(false));
  }, [ids]);

  const ROWS: { label: string; key: keyof Herb }[] = [
    { label: 'Scientific name', key: 'botanicalName' },
    { label: 'Family', key: 'plantFamily' },
    { label: 'Part used', key: 'plantPart' },
    { label: 'Element', key: 'element' },
    { label: 'Planet', key: 'planet' },
    { label: 'Zodiac', key: 'zodiac' },
    { label: 'Best timing', key: 'bestTiming' },
    { label: 'Moon phase', key: 'moonPhase' },
    { label: 'Magical uses', key: 'magicalUses' },
    { label: 'Tradition', key: 'traditionAttribution' },
    { label: 'Safety notes', key: 'safetyNotes' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(var(--background) / 0.9)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 0 60px hsl(var(--primary) / 0.1)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--background))' }}>
          <CloseIcon />
        </button>
        <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Side-by-Side Comparison</h2>
        <p className="text-xs mb-5 italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
          Comparing magical correspondences and safety — not medical equivalence.
        </p>
        {loading ? (
          <div className="text-center py-12" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
              <thead>
                <tr>
                  <th className="text-left py-2 pr-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em', width: '30%' }}>Field</th>
                  {compareHerbs.map((h) => (
                    <th key={h.id} className="text-left py-2 px-2 text-base" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>{h.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.key} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                    <td className="py-2 pr-4 text-xs align-top" style={{ color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{row.label}</td>
                    {compareHerbs.map((h) => (
                      <td key={h.id} className="py-2 px-2 align-top text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                        {String(h[row.key] ?? '—') || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  <td className="py-2 pr-4 text-xs align-top" style={{ color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pregnancy caution</td>
                  {compareHerbs.map((h) => (
                    <td key={h.id} className="py-2 px-2 align-top text-sm"
                      style={{ color: h.pregnancyCaution ? 'hsl(var(--herb-warning))' : 'hsl(var(--herb-verified))' }}>
                      {h.pregnancyCaution ? '⚠ Yes' : '✓ No'}
                    </td>
                  ))}
                </tr>
                <tr style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  <td className="py-2 pr-4 text-xs align-top" style={{ color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pet toxicity</td>
                  {compareHerbs.map((h) => (
                    <td key={h.id} className="py-2 px-2 align-top text-sm"
                      style={{ color: h.petToxicity ? 'hsl(var(--herb-warning))' : 'hsl(var(--herb-verified))' }}>
                      {h.petToxicity ? '⚠ Yes' : '✓ No'}
                    </td>
                  ))}
                </tr>
                <tr style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  <td className="py-2 pr-4 text-xs align-top" style={{ color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Source label</td>
                  {compareHerbs.map((h) => (
                    <td key={h.id} className="py-2 px-2 align-top">
                      <SourceBadge label={h.sourceLabel || 'TRADITIONAL CORRESPONDENCE'} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HerbsPage() {
  const [activeTab, setActiveTab] = useState<'herbs' | 'candles'>('herbs');
  const [herbs, setHerbs] = useState<Herb[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [spellType, setSpellType] = useState('');
  const [selectedHerb, setSelectedHerb] = useState<Herb | null>(null);
  const [selectedCandle, setSelectedCandle] = useState<Candle | null>(null);
  const [herbTotal, setHerbTotal] = useState(0);
  const [candleTotal, setCandleTotal] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [activeSection, setActiveSection] = useState<'directory' | 'explorer' | 'seasonal' | 'learning'>('directory');
  const [explorerIntention, setExplorerIntention] = useState('');
  const [explorerHerbs, setExplorerHerbs] = useState<Herb[]>([]);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [openPath, setOpenPath] = useState<number | null>(null);
  const season = getCurrentSeason();

  const fetchHerbs = useCallback(async (q: string, cat: string, spell: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (cat) params.set('category', cat);
      if (spell) params.set('spellType', spell);
      const res = await fetch(`/api/herbs?${params.toString()}`);
      const data = await res.json() as { results: Herb[]; total: number; categories: string[] };
      setHerbs(data.results);
      setHerbTotal(data.total);
      if (data.categories.length) setCategories(data.categories);
    } catch { setHerbs([]); }
    finally { setLoading(false); }
  }, []);

  const fetchCandles = useCallback(async (q: string, spell: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (spell) params.set('spellType', spell);
      const res = await fetch(`/api/candles?${params.toString()}`);
      const data = await res.json() as { results: Candle[]; total: number };
      setCandles(data.results);
      setCandleTotal(data.total);
    } catch { setCandles([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (activeTab === 'herbs') fetchHerbs(query, category, spellType);
      else fetchCandles(query, spellType);
    }, 250);
    return () => clearTimeout(t);
  }, [query, category, spellType, activeTab, fetchHerbs, fetchCandles]);

  const fetchExplorerHerbs = useCallback(async (intention: string) => {
    if (!intention) { setExplorerHerbs([]); return; }
    setExplorerLoading(true);
    try {
      const res = await fetch(`/api/herbs?spellType=${encodeURIComponent(intention)}`);
      const data = await res.json() as { results: Herb[] };
      setExplorerHerbs(data.results.slice(0, 12));
    } catch { setExplorerHerbs([]); }
    finally { setExplorerLoading(false); }
  }, []);

  useEffect(() => { fetchExplorerHerbs(explorerIntention); }, [explorerIntention, fetchExplorerHerbs]);

  const clearFilters = () => { setQuery(''); setCategory(''); setSpellType(''); };
  const hasFilters = query || category || spellType;
  const total = activeTab === 'herbs' ? herbTotal : candleTotal;

  const toggleCompare = (id: number) => {
    setCompareIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  return (
    <>
      <Helmet>
        <title>Magical Herb & Ingredient Guide — {herbTotal > 0 ? herbTotal : '97'}+ Ingredients | Spellful</title>
        <meta name="description" content="Source-transparent magical herb and ingredient guide with botanical identity, safety lens, and correspondence provenance. Search by ingredient, intention, or element." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Magical Herb & Ingredient Guide — Spellful" />
        <meta property="og:description" content="Source-transparent magical herb guide with botanical identity, safety warnings, and correspondence provenance. No signup required." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Magical Herb & Ingredient Guide — Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Magical Herb &amp; Ingredient Guide — Spellful" />
        <meta name="twitter:description" content="Source-transparent magical herb guide with botanical identity, safety warnings, and correspondence provenance." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          '@id': `${siteUrl}/herbs#webpage`,
          name: 'Magical Herb & Ingredient Guide — Spellful',
          url: `${siteUrl}/herbs`,
          description: 'Source-transparent magical herb and ingredient guide with botanical identity, safety lens, and correspondence provenance.',
          applicationCategory: 'LifestyleApplication',
          isAccessibleForFree: true,
          isPartOf: { '@id': `${siteUrl}/#website` },
        }).replace(/</g, '\u003c')}</script>
      </Helmet>

      <main>
        {/* Hero */}
        <section className="py-xxl text-center relative overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, hsl(var(--primary) / 0.07) 0%, transparent 70%)' }} />
          {HERO_STARS.map((s) => (
            <motion.div key={s.id} className="absolute rounded-full pointer-events-none"
              style={{ top: s.top, left: s.left, width: s.size, height: s.size, background: s.color, boxShadow: s.glow ? `0 0 ${s.size * 2}px 0.5px ${s.color}` : undefined }}
              animate={{ opacity: [0.04, s.glow ? 0.35 : 0.18, 0.04], scale: [1, s.glow ? 1.3 : 1.1, 1] }}
              transition={{ duration: s.duration, repeat: Infinity, ease: 'easeInOut', delay: s.delay }} />
          ))}
          <div className="relative z-10 max-w-2xl mx-auto px-base">
            <p className="text-xs mb-4" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>{herbsContent.hero.eyebrow}</p>
            <h1 className="text-5xl md:text-6xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{herbsContent.hero.title}</h1>
            <p className="text-base mb-6 max-w-lg mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{herbsContent.hero.subtitle}</p>
            {/* Source label legend */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {(['VERIFIED BOTANICAL FACT', 'DOCUMENTED HISTORICAL USE', 'TRADITIONAL CORRESPONDENCE', 'UNVERIFIED'] as const).map((label) => {
                const cfg = sourceLabelConfig(label);
                return (
                  <span key={label} title={cfg.description} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full cursor-help"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`, fontFamily: 'var(--font-sans)' }}>
                    <span>{cfg.icon}</span><span className="hidden sm:inline">{label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section nav */}
        <nav aria-label="Grimoire sections" className="sticky top-0 z-30 py-3 px-base"
          style={{ background: 'hsl(var(--background) / 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto">
            {([
              { key: 'directory', label: '🌿 Directory' },
              { key: 'explorer', label: '✦ Correspondence Explorer' },
              { key: 'seasonal', label: '🌙 Seasonal Discovery' },
              { key: 'learning', label: '📖 Learning Paths' },
            ] as const).map((s) => (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className="shrink-0 text-sm px-4 py-2 rounded-full transition-all"
                style={{
                  background: activeSection === s.key ? 'hsl(var(--primary))' : 'transparent',
                  color: activeSection === s.key ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                  fontFamily: 'var(--font-sans)',
                  border: activeSection === s.key ? 'none' : '1px solid hsl(var(--border))',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── DIRECTORY ── */}
        {activeSection === 'directory' && (
          <section className="py-xl px-base max-w-5xl mx-auto">
            <div className="flex gap-2 mb-6">
              {(['herbs', 'candles'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-5 py-2 rounded-full text-sm capitalize"
                  style={{
                    background: activeTab === tab ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                    color: activeTab === tab ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                    fontFamily: 'var(--font-sans)',
                    border: activeTab === tab ? 'none' : '1px solid hsl(var(--border))',
                  }}>
                  {tab === 'herbs' ? '🌿 Herbs & Ingredients' : '🕯 Candle Colors'}
                </button>
              ))}
            </div>

            {/* Search & filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }}><SearchIcon /></span>
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder={activeTab === 'herbs' ? 'Search herbs, botanical names, traditions…' : 'Search candle colors…'}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }} />
              </div>
              {activeTab === 'herbs' && (
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', minWidth: 140 }}>
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <select value={spellType} onChange={(e) => setSpellType(e.target.value)}
                className="px-3 py-2.5 rounded-xl text-sm"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', minWidth: 140 }}>
                {SPELL_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Compare mode */}
            {activeTab === 'herbs' && (
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => { setCompareMode(!compareMode); setCompareIds([]); }}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    background: compareMode ? 'hsl(var(--accent) / 0.15)' : 'hsl(var(--card))',
                    color: compareMode ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))',
                    fontFamily: 'var(--font-sans)',
                    border: `1px solid ${compareMode ? 'hsl(var(--accent) / 0.4)' : 'hsl(var(--border))'}`,
                  }}>
                  ⇄ Compare mode {compareMode ? 'ON' : 'OFF'}
                </button>
                {compareMode && compareIds.length >= 2 && (
                  <button onClick={() => setShowCompare(true)}
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Compare {compareIds.length} ingredients →
                  </button>
                )}
                {compareMode && <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Select 2–4 ingredients to compare</span>}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {loading ? 'Loading…' : `${total} ${activeTab === 'herbs' ? 'ingredients' : 'candle colors'}`}
              </p>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs px-3 py-1 rounded-full"
                  style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-2xl h-32 animate-pulse" style={{ background: 'hsl(var(--card))' }} />
                ))}
              </div>
            ) : activeTab === 'herbs' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {herbs.map((herb) => {
                  const isSelected = compareIds.includes(herb.id);
                  const cfg = sourceLabelConfig(herb.sourceLabel || 'TRADITIONAL CORRESPONDENCE');
                  const hasWarning = herb.pregnancyCaution || herb.petToxicity ||
                    (herb.ingestionWarning?.toUpperCase().includes('TOXIC') ?? false);
                  return (
                    <motion.div key={herb.id} whileHover={{ y: -2 }}
                      onClick={() => compareMode ? toggleCompare(herb.id) : setSelectedHerb(herb)}
                      className="rounded-2xl p-5 cursor-pointer relative"
                      style={{
                        background: 'hsl(var(--card))',
                        border: isSelected ? '2px solid hsl(var(--accent))' : '1px solid hsl(var(--border))',
                        boxShadow: isSelected ? '0 0 20px hsl(var(--accent) / 0.2)' : undefined,
                      }}>
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={{ background: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>✓</span>
                      )}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--border))' }}>{herb.category}</span>
                          {herb.element && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--primary) / 0.1)', color: elementColor(herb.element), fontFamily: 'var(--font-sans)' }}>◈ {herb.element}</span>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {hasWarning && <span title="Safety warning" style={{ color: 'hsl(var(--herb-warning))', fontSize: 12 }}>⚠</span>}
                          <span title={cfg.description} style={{ color: cfg.color, fontSize: 13 }}>{cfg.icon}</span>
                        </div>
                      </div>
                      <h3 className="text-xl mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{herb.name}</h3>
                      {herb.botanicalName && <p className="text-xs italic mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{herb.botanicalName}</p>}
                      {herb.aliases && !herb.botanicalName && <p className="text-xs italic mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{herb.aliases}</p>}
                      <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{herb.magicalUses}</p>
                      {herb.planet && (
                        <p className="text-xs mt-2" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>☽ {herb.planet}</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {candles.map((candle) => (
                  <motion.div key={candle.id} whileHover={{ y: -2 }}
                    onClick={() => setSelectedCandle(candle)}
                    className="rounded-2xl p-5 cursor-pointer"
                    style={{ background: 'hsl(var(--card))', border: `1px solid ${candle.hex}44` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full shrink-0" style={{ background: candle.hex, boxShadow: `0 0 16px ${candle.hex}66` }} />
                      <div>
                        <h3 className="text-xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{candle.color}</h3>
                        {candle.element && <p className="text-xs" style={{ color: elementColor(candle.element), fontFamily: 'var(--font-sans)' }}>◈ {candle.element}</p>}
                      </div>
                    </div>
                    <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{candle.magicalUses}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── CORRESPONDENCE EXPLORER ── */}
        {activeSection === 'explorer' && (
          <section className="py-xl px-base max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Correspondence Explorer</h2>
              <p className="text-sm max-w-xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                Explore ingredients by magical intention. Each connection is labeled with its source tradition.
                Multiple traditions may associate different ingredients with the same intention — all are shown.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
              {INTENTIONS.map((int) => (
                <button key={int.value} onClick={() => setExplorerIntention(explorerIntention === int.value ? '' : int.value)}
                  className="rounded-2xl p-4 text-center transition-all"
                  style={{
                    background: explorerIntention === int.value ? `hsl(var(${int.colorVar}) / 0.15)` : 'hsl(var(--card))',
                    border: `1px solid ${explorerIntention === int.value ? `hsl(var(${int.colorVar}))` : 'hsl(var(--border))'}`,
                    boxShadow: explorerIntention === int.value ? `0 0 20px hsl(var(${int.colorVar}) / 0.2)` : undefined,
                  }}>
                  <div className="text-2xl mb-1">{int.icon}</div>
                  <p className="text-xs" style={{ color: explorerIntention === int.value ? `hsl(var(${int.colorVar}))` : 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{int.label}</p>
                </button>
              ))}
            </div>

            {explorerIntention && (
              <>
                <h3 className="text-xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  Ingredients for {INTENTIONS.find((i) => i.value === explorerIntention)?.label}
                </h3>
                {explorerLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: 'hsl(var(--card))' }} />)}
                  </div>
                ) : explorerHerbs.length === 0 ? (
                  <p className="text-center py-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>No ingredients found for this intention yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {explorerHerbs.map((herb) => {
                      const cfg = sourceLabelConfig(herb.sourceLabel || 'TRADITIONAL CORRESPONDENCE');
                      return (
                        <motion.div key={herb.id} whileHover={{ y: -2 }}
                          onClick={() => setSelectedHerb(herb)}
                          className="rounded-2xl p-4 cursor-pointer"
                          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--border))' }}>{herb.category}</span>
                            <span title={cfg.description} style={{ color: cfg.color, fontSize: 13 }}>{cfg.icon}</span>
                          </div>
                          <h4 className="text-lg mb-0.5" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{herb.name}</h4>
                          {herb.botanicalName && <p className="text-xs italic mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{herb.botanicalName}</p>}
                          {herb.correspondenceProvenance && (
                            <p className="text-xs mt-1 line-clamp-2 italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                              {herb.correspondenceProvenance.slice(0, 100)}…
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs mt-4 text-center italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Showing up to 12 ingredients. Use the Directory for full search.
                </p>
              </>
            )}

            {!explorerIntention && (
              <div className="text-center py-12" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                <p className="text-4xl mb-3">✦</p>
                <p>Select an intention above to explore connected ingredients</p>
              </div>
            )}
          </section>
        )}

        {/* ── SEASONAL DISCOVERY ── */}
        {activeSection === 'seasonal' && (
          <section className="py-xl px-base max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Seasonal Discovery</h2>
              <p className="text-sm max-w-xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                Traditional herb associations for the current season and upcoming sabbats.
                These are symbolic and traditional associations — not harvesting or foraging advice.
              </p>
            </div>

            <div className="rounded-2xl p-6 mb-6" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.2)' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{season.name === 'Spring' ? '🌸' : season.name === 'Summer' ? '☀' : season.name === 'Autumn' ? '🍂' : '❄'}</span>
                <div>
                  <h3 className="text-2xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{season.name}</h3>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{season.dateRange}</p>
                </div>
                {season.sabbat && (
                  <span className="ml-auto text-xs px-3 py-1 rounded-full" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                    ✦ {season.sabbat}
                  </span>
                )}
              </div>
              <p className="text-xs mb-4 italic" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Traditional associations — labeled TRADITIONAL CORRESPONDENCE. Seasons and availability vary by location.
                Never harvest protected species or unsafe look-alikes. Promote ethical sourcing.
              </p>
              <div className="flex flex-wrap gap-2">
                {season.herbs.map((name) => (
                  <button key={name} onClick={() => { setQuery(name); setActiveSection('directory'); }}
                    className="text-sm px-4 py-2 rounded-full"
                    style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--border))' }}>
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <h3 className="text-xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>All Seasons</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Spring', icon: '🌸', dateRange: 'March – May', herbs: ['Violet', 'Dandelion Root', 'Hawthorn', 'Elderflower', 'Vervain', 'Calendula'], sabbats: 'Ostara, Beltane' },
                { name: 'Summer', icon: '☀', dateRange: 'June – August', herbs: ['St. John\'s Wort', 'Lavender', 'Chamomile', 'Rosemary', 'Yarrow', 'Basil'], sabbats: 'Litha, Lughnasadh' },
                { name: 'Autumn', icon: '🍂', dateRange: 'September – November', herbs: ['Mugwort', 'Wormwood', 'Valerian Root', 'Sage', 'Myrrh', 'Frankincense'], sabbats: 'Mabon, Samhain' },
                { name: 'Winter', icon: '❄', dateRange: 'December – February', herbs: ['Mistletoe', 'Cedar', 'Frankincense', 'Myrrh', 'Cinnamon', 'Rosemary'], sabbats: 'Yule, Imbolc' },
              ].map((s) => (
                <div key={s.name} className="rounded-2xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <h4 className="text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{s.name}</h4>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{s.dateRange} · {s.sabbats}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.herbs.map((name) => (
                      <button key={name} onClick={() => { setQuery(name); setActiveSection('directory'); }}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', border: '1px solid hsl(var(--border))' }}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── LEARNING PATHS ── */}
        {activeSection === 'learning' && (
          <section className="py-xl px-base max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Learning Paths</h2>
              <p className="text-sm max-w-xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>
                Beginner-to-advanced guides for understanding magical herbalism with source transparency.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {LEARNING_PATHS.map((path, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
                  <button onClick={() => setOpenPath(openPath === i ? null : i)}
                    className="w-full flex items-center gap-4 p-5 text-left"
                    style={{ background: 'hsl(var(--card))' }}>
                    <span className="text-3xl shrink-0">{path.icon}</span>
                    <div className="flex-1">
                      <span className="text-xs px-2 py-0.5 rounded-full mr-2"
                        style={{ background: `hsl(var(${path.colorVar}) / 0.15)`, color: `hsl(var(${path.colorVar}))`, fontFamily: 'var(--font-sans)', border: `1px solid hsl(var(${path.colorVar}) / 0.4)` }}>
                        {path.level}
                      </span>
                      <h3 className="text-xl mt-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{path.title}</h3>
                    </div>
                    <ChevronIcon open={openPath === i} />
                  </button>
                  {openPath === i && (
                    <div className="px-5 pb-5 pt-2" style={{ background: 'hsl(var(--background))' }}>
                      {path.paragraphs.map((para, j) => (
                        <p key={j} className="text-sm leading-relaxed mb-3" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontWeight: 300 }}>{para}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Source bibliography */}
            <div className="mt-8 rounded-2xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <h3 className="text-xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Key Sources</h3>
              <div className="flex flex-col gap-2">
                {[
                  { title: 'Kew Plants of the World Online', url: 'https://powo.science.kew.org', desc: 'Authoritative botanical taxonomy' },
                  { title: 'NIH NCCIH Herb Fact Sheets', url: 'https://www.nccih.nih.gov/health/herbsataglance', desc: 'Evidence-based health information' },
                  { title: 'Culpeper\'s Complete Herbal (1653)', url: 'https://www.gutenberg.org/ebooks/49513', desc: 'Historical planetary attributions' },
                  { title: 'Cunningham\'s Encyclopedia of Magical Herbs (1985)', url: null, desc: 'Modern magical correspondence reference' },
                  { title: 'Agrippa\'s Three Books of Occult Philosophy (1531)', url: null, desc: 'Renaissance magical philosophy' },
                ].map((src) => (
                  <div key={src.title} className="flex items-start gap-3 text-sm" style={{ fontFamily: 'var(--font-sans)' }}>
                    <span style={{ color: 'hsl(var(--primary))' }}>✦</span>
                    <div>
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(var(--foreground))' }}>{src.title}</a>
                      ) : (
                        <span style={{ color: 'hsl(var(--foreground))' }}>{src.title}</span>
                      )}
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}> — {src.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Modals */}
        <AnimatePresence>
          {selectedHerb && (
            <HerbDetailModal
              herb={selectedHerb}
              onClose={() => setSelectedHerb(null)}
              onSpellTypeClick={(t) => { setSpellType(t); setActiveSection('directory'); }}
            />
          )}
          {selectedCandle && (
            <CandleDetailModal
              candle={selectedCandle}
              onClose={() => setSelectedCandle(null)}
              onSpellTypeClick={(t) => { setSpellType(t); setActiveSection('directory'); }}
            />
          )}
          {showCompare && compareIds.length >= 2 && (
            <ComparePanel ids={compareIds} onClose={() => setShowCompare(false)} />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
