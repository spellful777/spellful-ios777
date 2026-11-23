import { dashboard } from 'virtual:content';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import {
  Sparkles, BookOpen, Calendar, Moon, Leaf, Feather, Zap, Star,
  Settings2, Plus, X, ChevronUp, ChevronDown, GripVertical,
  MessageCircle, ArrowRight, Check, Loader2, Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth/auth-client';
import {
  getDailyData,
  getUpcomingEvents,
  type DailyData,
} from '@/lib/daily-dashboard-data';
import { formatEventDate } from '@/lib/astro-feed';
import MoonNightSky from '@/components/MoonNightSky';
import TwinkleStars from '@/components/TwinkleStars';
import QuickStartChips from '@/components/QuickStartChips';

// ── Types ─────────────────────────────────────────────────────────────────────
interface WidgetConfig {
  widgetType: string;
  sortOrder: number;
  isVisible: boolean;
  settings: Record<string, unknown>;
}

interface DashboardPrefs {
  onboardingComplete: boolean;
  interests: string[];
  theme: string;
  density: string;
  dashboardTitle: string;
  timezone: string;
}

interface GrimoireEntry {
  id: number;
  type: string;
  title: string;
  createdAt: string;
}

interface ConversationPreview {
  id: number;
  otherUser: { name: string; username: string };
  unreadCount: number;
  lastMessageAt: string;
}

// ── Widget catalogue ──────────────────────────────────────────────────────────
const WIDGET_CATALOGUE = [
  { type: 'moon',         label: 'Moon Now',          icon: '🌙', description: 'Current phase, illumination, and ritual link' },
  { type: 'tarot',        label: 'Card of the Day',   icon: '🃏', description: 'Daily tarot draw with interpretation' },
  { type: 'affirmation',  label: 'Daily Affirmation', icon: '✨', description: 'Intention and journal prompt for today' },
  { type: 'herb-crystal', label: 'Herb & Crystal',    icon: '🌿', description: "Today's herb and crystal correspondences" },
  { type: 'events',       label: 'Cosmic Calendar',   icon: '🔭', description: 'Upcoming celestial events' },
  { type: 'grimoire',     label: 'Living Grimoire',   icon: '📖', description: 'Your recent saved entries' },
  { type: 'journal',      label: 'Journal Prompt',    icon: '🪶', description: 'A reflective question for today' },
  { type: 'spell',        label: 'Spell of the Day',  icon: '⚡', description: 'A short daily practice' },
  { type: 'messages',     label: 'Messages',          icon: '💬', description: 'Inbox preview and unread count' },
  { type: 'quick-links',  label: 'Quick Links',       icon: '🔗', description: 'Shortcuts to your favourite pages' },
] as const;

type WidgetType = typeof WIDGET_CATALOGUE[number]['type'];

const DEFAULT_WIDGET_LAYOUT: WidgetConfig[] = [
  { widgetType: 'moon',         sortOrder: 0, isVisible: true, settings: {} },
  { widgetType: 'tarot',        sortOrder: 1, isVisible: true, settings: {} },
  { widgetType: 'affirmation',  sortOrder: 2, isVisible: true, settings: {} },
  { widgetType: 'herb-crystal', sortOrder: 3, isVisible: true, settings: {} },
  { widgetType: 'events',       sortOrder: 4, isVisible: true, settings: {} },
  { widgetType: 'grimoire',     sortOrder: 5, isVisible: true, settings: {} },
  { widgetType: 'journal',      sortOrder: 6, isVisible: true, settings: {} },
  { widgetType: 'spell',        sortOrder: 7, isVisible: true, settings: {} },
];

const STARTER_LAYOUTS: Record<string, WidgetType[]> = {
  calm:           ['moon', 'affirmation', 'journal', 'herb-crystal'],
  celestial:      ['moon', 'tarot', 'affirmation', 'herb-crystal', 'events', 'grimoire', 'journal', 'spell'],
  botanical:      ['herb-crystal', 'moon', 'affirmation', 'journal', 'grimoire'],
  'dark-grimoire':['grimoire', 'tarot', 'moon', 'spell', 'journal', 'events'],
};

const INTEREST_OPTIONS = [
  { id: 'tarot',      label: 'Tarot',        icon: '🃏' },
  { id: 'moon',       label: 'Moon Phases',  icon: '🌙' },
  { id: 'astrology',  label: 'Astrology',    icon: '♈' },
  { id: 'spells',     label: 'Spells',       icon: '⚡' },
  { id: 'herbs',      label: 'Herbalism',    icon: '🌿' },
  { id: 'crystals',   label: 'Crystals',     icon: '💎' },
  { id: 'journaling', label: 'Journaling',   icon: '🪶' },
  { id: 'dreams',     label: 'Dream Work',   icon: '🌌' },
  { id: 'learning',   label: 'Learning',     icon: '📚' },
  { id: 'community',  label: 'Community',    icon: '🕯️' },
];

const THEME_OPTIONS = [
  { id: 'calm',          label: 'Calm & Minimal',   desc: 'Clean, spacious, serene',         accent: '#B8A9D9' },
  { id: 'celestial',     label: 'Celestial',         desc: 'Stars, gold, cosmic depth',       accent: '#C9A84C' },
  { id: 'botanical',     label: 'Botanical',         desc: 'Earthy greens, natural warmth',   accent: '#7CB87C' },
  { id: 'dark-grimoire', label: 'Dark Grimoire',     desc: 'Deep shadows, ritual atmosphere', accent: '#9B6B9B' },
];

const EVENT_COLORS: Record<string, string> = {
  moon: 'hsl(var(--accent))', eclipse: 'hsl(var(--destructive))',
  planet: 'hsl(var(--info))', sabbat: 'hsl(var(--primary))',
  ingress: 'hsl(var(--accent))',
};

const GRIMOIRE_TYPE_COLORS: Record<string, string> = {
  spell: 'hsl(var(--primary))', herb: 'hsl(var(--grimoire-herb))',
  crystal: 'hsl(var(--accent))', ritual: 'hsl(var(--grimoire-ritual))',
  tarot: 'hsl(var(--grimoire-tarot))', dream: 'hsl(var(--grimoire-dream))',
  journal: 'hsl(var(--muted-foreground))',
};

const GRIMOIRE_TYPE_ICONS: Record<string, string> = {
  spell: '✦', herb: '🌿', crystal: '💎', ritual: '🕯️',
  tarot: '🃏', dream: '🌙', journal: '📖',
};

// ── Shared widget shell ───────────────────────────────────────────────────────
function WidgetShell({
  label, icon, accent, children, compact = false,
}: {
  label: string;
  icon: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden h-full"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <span style={{ color: accent ?? 'hsl(var(--primary))' }}>{icon}</span>
        <h2
          className={compact ? 'text-base' : 'text-lg'}
          style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}
        >
          {label}
        </h2>
      </div>
      <div className={compact ? 'p-3' : 'p-4'}>{children}</div>
    </div>
  );
}

function SkeletonWidget() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="w-4 h-4 rounded animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
        <div className="w-32 h-4 rounded animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: 'hsl(var(--muted))' }} />
        ))}
      </div>
    </div>
  );
}

// ── Individual widgets ────────────────────────────────────────────────────────
function MoonWidget({ data, compact }: { data: DailyData; compact?: boolean }) {
  const { moon } = data;
  return (
    <WidgetShell label="Moon Now" icon={<Moon className="w-4 h-4" />} accent="hsl(var(--accent))" compact={compact}>
      <div className="flex items-center gap-4">
        <span className="text-5xl flex-shrink-0">{moon.phaseInfo.glyph}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xl mb-0.5" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
            {moon.phaseInfo.name}
          </p>
          <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {moon.age} days old · {moon.illumination}% illuminated
          </p>
          <p className="text-xs mb-2" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>
            {moon.phaseInfo.energy}
          </p>
          <div className="flex flex-wrap gap-1">
            {moon.phaseInfo.keywords.slice(0, 3).map((kw: string) => (
              <span key={kw} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 flex-wrap">
        <Link to="/moon-ritual">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
            <Sparkles className="w-3 h-3" /> Ritual
          </Button>
        </Link>
        <Link to="/moon-calendar">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
            <Calendar className="w-3 h-3" /> Calendar
          </Button>
        </Link>
      </div>
    </WidgetShell>
  );
}

function TarotWidget({ data, compact }: { data: DailyData; compact?: boolean }) {
  const { card: { card, reversed } } = data;
  const meaning = reversed ? card.reversedMeaning : card.uprightMeaning;
  return (
    <WidgetShell label="Card of the Day" icon={<Star className="w-4 h-4" />} accent="hsl(var(--grimoire-tarot))" compact={compact}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-16 h-[102px] rounded-lg overflow-hidden"
          style={{ border: '1px solid hsl(var(--border))' }}>
          {card.image ? (
            <img src={card.image} alt={card.name} className="w-full h-full object-cover" loading="eager" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, hsl(var(--card-deep)) 0%, hsl(var(--muted)) 100%)' }}>
              🃏
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <p className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
              {card.name}
            </p>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: reversed ? 'hsl(var(--destructive) / 0.15)' : 'hsl(var(--primary) / 0.15)',
                color: reversed ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                fontFamily: 'var(--font-sans)',
              }}>
              {reversed ? 'Reversed' : 'Upright'}
            </span>
          </div>
          <p className="text-xs leading-relaxed line-clamp-3"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {meaning}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Link to="/tarot">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
            <Star className="w-3 h-3" /> Full Reading
          </Button>
        </Link>
      </div>
    </WidgetShell>
  );
}

function AffirmationWidget({ data, compact }: { data: DailyData; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(data.affirmation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => undefined);
  };
  return (
    <WidgetShell label="Daily Affirmation" icon={<Sparkles className="w-4 h-4" />} accent="hsl(var(--primary))" compact={compact}>
      <blockquote className="text-base leading-relaxed mb-3 italic"
        style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)', borderLeft: '3px solid hsl(var(--primary))', paddingLeft: '0.75rem' }}>
        "{data.affirmation}"
      </blockquote>
      {data.journalPrompt && (
        <p className="text-xs mb-3 leading-relaxed"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
          <span style={{ color: 'hsl(var(--accent))' }}>Reflect: </span>{data.journalPrompt}
        </p>
      )}
      <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={copy}>
        {copied ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </WidgetShell>
  );
}

function HerbCrystalWidget({ data, compact }: { data: DailyData; compact?: boolean }) {
  return (
    <WidgetShell label="Herb & Crystal" icon={<Leaf className="w-4 h-4" />} accent="hsl(var(--grimoire-herb))" compact={compact}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3" style={{ background: 'hsl(var(--muted))' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">🌿</span>
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--grimoire-herb))', fontFamily: 'var(--font-sans)' }}>Herb</span>
          </div>
          <p className="text-sm font-medium mb-0.5" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
            {data.herb.name}
          </p>
          <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {data.herb.tip}
          </p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'hsl(var(--muted))' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">💎</span>
            <span className="text-xs font-medium" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>Crystal</span>
          </div>
          <p className="text-sm font-medium mb-0.5" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
            {data.crystal.name}
          </p>
          <p className="text-xs line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {data.crystal.tip}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Link to="/herbs">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
            <Leaf className="w-3 h-3" /> Herb Grimoire
          </Button>
        </Link>
      </div>
    </WidgetShell>
  );
}

function EventsWidget({ date, compact }: { date: Date; compact?: boolean }) {
  const events = getUpcomingEvents(date, 5);
  return (
    <WidgetShell label="Cosmic Calendar" icon={<Calendar className="w-4 h-4" />} accent="hsl(var(--primary))" compact={compact}>
      <div className="space-y-2">
        {events.map((event, i) => {
          const diffDays = Math.ceil((event.date.getTime() - Date.now()) / 86400000);
          const color = EVENT_COLORS[event.category] ?? 'hsl(var(--muted-foreground))';
          return (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
              <span className="text-base flex-shrink-0">{event.glyph}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                  {event.label}
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {formatEventDate(event.date)}
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: `${color}22`, color, fontFamily: 'var(--font-sans)' }}>
                {diffDays <= 0 ? 'Today' : `${diffDays}d`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3">
        <Link to="/moon-calendar">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
            <Calendar className="w-3 h-3" /> Full Calendar
          </Button>
        </Link>
      </div>
    </WidgetShell>
  );
}

function GrimoireWidget({ compact }: { compact?: boolean }) {
  const [entries, setEntries] = useState<GrimoireEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch('/api/grimoire?limit=4', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((data: GrimoireEntry[]) => { setEntries(data.slice(0, 4)); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);
  return (
    <WidgetShell label="Living Grimoire" icon={<BookOpen className="w-4 h-4" />} accent="hsl(var(--grimoire-tarot))" compact={compact}>
      {!loaded ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'hsl(var(--muted))' }} />)}</div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-center py-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
          Your grimoire is empty — start saving readings, rituals, and reflections.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => {
            const color = GRIMOIRE_TYPE_COLORS[entry.type] ?? 'hsl(var(--muted-foreground))';
            const icon = GRIMOIRE_TYPE_ICONS[entry.type] ?? '✦';
            return (
              <div key={entry.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                <span className="text-base flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                    {entry.title}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
                  style={{ background: `${color}22`, color, fontFamily: 'var(--font-sans)' }}>
                  {entry.type}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-3">
        <Link to="/grimoire">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
            <BookOpen className="w-3 h-3" /> Open Grimoire
          </Button>
        </Link>
      </div>
    </WidgetShell>
  );
}

function JournalWidget({ data, compact }: { data: DailyData; compact?: boolean }) {
  return (
    <WidgetShell label="Journal Prompt" icon={<Feather className="w-4 h-4" />} accent="hsl(var(--grimoire-dream))" compact={compact}>
      <p className="text-sm leading-relaxed mb-3 italic"
        style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
        "{data.journalPrompt}"
      </p>
      <Link to="/dream-journal">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
          <Feather className="w-3 h-3" /> Write Entry
        </Button>
      </Link>
    </WidgetShell>
  );
}

function SpellWidget({ data, compact }: { data: DailyData; compact?: boolean }) {
  const { spell } = data;
  return (
    <WidgetShell label="Spell of the Day" icon={<Zap className="w-4 h-4" />} accent="hsl(var(--grimoire-ritual))" compact={compact}>
      <p className="text-lg mb-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
        {spell.name}
      </p>
      <div className="flex flex-wrap gap-1 mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
          {spell.type}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
          ⏱ {spell.duration}
        </span>
      </div>
      <p className="text-xs leading-relaxed mb-3 line-clamp-3"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
        {spell.description}
      </p>
      <Link to="/spells">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
          <Zap className="w-3 h-3" /> Spell Library
        </Button>
      </Link>
    </WidgetShell>
  );
}

function MessagesWidget({ compact }: { compact?: boolean }) {
  const [convos, setConvos] = useState<ConversationPreview[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fetch('/api/conversations', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((raw: { conversations?: ConversationPreview[] } | ConversationPreview[]) => {
        const data: ConversationPreview[] = Array.isArray(raw) ? raw : (raw.conversations ?? []);
        setConvos(data.slice(0, 3)); setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);
  const totalUnread = convos.reduce((s, c) => s + (c.unreadCount ?? 0), 0);
  return (
    <WidgetShell label="Messages" icon={<MessageCircle className="w-4 h-4" />} accent="hsl(var(--info))" compact={compact}>
      {!loaded ? (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'hsl(var(--muted))' }} />)}</div>
      ) : convos.length === 0 ? (
        <p className="text-sm text-center py-3" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
          No conversations yet.
        </p>
      ) : (
        <div className="space-y-2">
          {convos.map(c => (
            <Link key={c.id} to="/messages">
              <div className="flex items-center gap-3 p-2.5 rounded-lg transition-colors" style={{ background: 'hsl(var(--muted))' }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}>
                  {(c.otherUser?.name ?? '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                    {c.otherUser?.name ?? 'Unknown'}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-3">
        <Link to="/messages">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7">
            <MessageCircle className="w-3 h-3" />
            {totalUnread > 0 ? `${totalUnread} unread` : 'Open Inbox'}
          </Button>
        </Link>
      </div>
    </WidgetShell>
  );
}

function QuickLinksWidget({ compact }: { compact?: boolean }) {
  const links = [
    { label: 'Birth Chart', to: '/birth-chart', icon: '♈' },
    { label: 'Moon Ritual', to: '/moon-ritual', icon: '🌙' },
    { label: 'Tarot', to: '/tarot', icon: '🃏' },
    { label: 'Astrology', to: '/astrology', icon: '⭐' },
    { label: 'Herbs', to: '/herbs', icon: '🌿' },
    { label: 'Community', to: '/community', icon: '🕯️' },
  ];
  return (
    <WidgetShell label="Quick Links" icon={<ArrowRight className="w-4 h-4" />} accent="hsl(var(--muted-foreground))" compact={compact}>
      <div className="grid grid-cols-3 gap-2">
        {links.map(l => (
          <Link key={l.to} to={l.to}>
            <div className="flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-colors"
              style={{ background: 'hsl(var(--muted))' }}>
              <span className="text-xl">{l.icon}</span>
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {l.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </WidgetShell>
  );
}

// ── Widget renderer ───────────────────────────────────────────────────────────
function RenderWidget({ type, data, compact }: { type: string; data: DailyData; compact: boolean }) {
  switch (type) {
    case 'moon':         return <MoonWidget data={data} compact={compact} />;
    case 'tarot':        return <TarotWidget data={data} compact={compact} />;
    case 'affirmation':  return <AffirmationWidget data={data} compact={compact} />;
    case 'herb-crystal': return <HerbCrystalWidget data={data} compact={compact} />;
    case 'events':       return <EventsWidget date={data.date} compact={compact} />;
    case 'grimoire':     return <GrimoireWidget compact={compact} />;
    case 'journal':      return <JournalWidget data={data} compact={compact} />;
    case 'spell':        return <SpellWidget data={data} compact={compact} />;
    case 'messages':     return <MessagesWidget compact={compact} />;
    case 'quick-links':  return <QuickLinksWidget compact={compact} />;
    default:             return null;
  }
}

// ── Onboarding wizard ─────────────────────────────────────────────────────────
function OnboardingWizard({ onComplete }: { onComplete: (prefs: Partial<DashboardPrefs>) => void }) {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [theme, setTheme] = useState('celestial');
  const [saving, setSaving] = useState(false);

  const toggleInterest = (id: string) =>
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const finish = async (skip = false) => {
    setSaving(true);
    const prefs: Partial<DashboardPrefs> = {
      onboardingComplete: true,
      interests: skip ? [] : interests,
      theme: skip ? 'celestial' : theme,
    };
    try {
      await fetch('/api/dashboard/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(prefs),
      });
    } catch (_) { /* non-fatal */ }
    onComplete(prefs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(var(--background) / 0.95)', backdropFilter: 'blur(8px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? '2rem' : '0.75rem',
                    background: i <= step ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }} />
              ))}
            </div>
            <button onClick={() => finish(true)} className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Skip setup
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            Step {step + 1} of 3
          </p>
        </div>

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl mb-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                  What calls to you?
                </h2>
                <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Choose your interests — we'll tailor your sanctuary.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {INTEREST_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => toggleInterest(opt.id)}
                      className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                      style={{
                        background: interests.includes(opt.id) ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                        border: `1px solid ${interests.includes(opt.id) ? 'hsl(var(--primary) / 0.5)' : 'transparent'}`,
                        color: 'hsl(var(--foreground))',
                        fontFamily: 'var(--font-sans)',
                      }}>
                      <span className="text-lg">{opt.icon}</span>
                      <span className="text-sm">{opt.label}</span>
                      {interests.includes(opt.id) && <Check className="w-3 h-3 ml-auto" style={{ color: 'hsl(var(--primary))' }} />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl mb-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                  Choose your atmosphere
                </h2>
                <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  Pick a dashboard style that feels like home.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {THEME_OPTIONS.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className="p-4 rounded-xl text-left transition-all"
                      style={{
                        background: theme === t.id ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--muted))',
                        border: `2px solid ${theme === t.id ? t.accent : 'transparent'}`,
                      }}>
                      <div className="w-6 h-6 rounded-full mb-2" style={{ background: t.accent }} />
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                        {t.label}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {t.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl mb-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                  Your sanctuary is ready
                </h2>
                <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  We've set up a starter layout based on your choices. You can rearrange or add widgets any time.
                </p>
                <div className="rounded-xl p-4 mb-4" style={{ background: 'hsl(var(--muted))' }}>
                  <p className="text-xs mb-2 font-medium" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Your starter widgets
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(STARTER_LAYOUTS[theme] ?? STARTER_LAYOUTS.celestial).map(wt => {
                      const meta = WIDGET_CATALOGUE.find(w => w.type === wt);
                      return meta ? (
                        <span key={wt} className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                          {meta.icon} {meta.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  You can always add more widgets or change your theme in the Customize menu.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 pb-6 flex justify-between items-center">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>Back</Button>
          ) : <div />}
          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)}
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
              Continue
            </Button>
          ) : (
            <Button onClick={() => finish(false)} disabled={saving}
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Enter My Sanctuary
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Customize drawer ──────────────────────────────────────────────────────────
function CustomizeDrawer({
  widgets, onSave, onClose,
}: {
  widgets: WidgetConfig[];
  onSave: (w: WidgetConfig[]) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<WidgetConfig[]>([...widgets]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // dragIndex ref kept for future drag-and-drop enhancement
  const dragIndexRef = useRef<number | null>(null); void dragIndexRef;

  const visible = local.filter(w => w.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  const hidden  = local.filter(w => !w.isVisible);

  const move = (type: string, dir: -1 | 1) => {
    setLocal(prev => {
      const sorted = [...prev].sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = sorted.findIndex(w => w.widgetType === type);
      const target = idx + dir;
      if (target < 0 || target >= sorted.length) return prev;
      const next = sorted.map(w => ({ ...w }));
      const tmp = next[idx].sortOrder;
      next[idx].sortOrder = next[target].sortOrder;
      next[target].sortOrder = tmp;
      return next;
    });
  };

  const toggle = (type: string) => {
    setLocal(prev => prev.map(w =>
      w.widgetType === type ? { ...w, isVisible: !w.isVisible } : w
    ));
  };

  const addWidget = (type: string) => {
    const maxOrder = Math.max(0, ...local.map(w => w.sortOrder));
    setLocal(prev => {
      const existing = prev.find(w => w.widgetType === type);
      if (existing) return prev.map(w => w.widgetType === type ? { ...w, isVisible: true, sortOrder: maxOrder + 1 } : w);
      return [...prev, { widgetType: type, sortOrder: maxOrder + 1, isVisible: true, settings: {} }];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/dashboard/widgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(local),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSave(local);
    } catch (_) { /* non-fatal */ }
    setSaving(false);
  };

  const availableToAdd = WIDGET_CATALOGUE.filter(w => !local.some(l => l.widgetType === w.type && l.isVisible));

  return (
    <div className="fixed inset-0 z-40 flex" style={{ background: 'hsl(var(--background) / 0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="ml-auto h-full w-full max-w-sm overflow-y-auto"
        style={{ background: 'hsl(var(--card))', borderLeft: '1px solid hsl(var(--border))' }}>
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
          style={{ background: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
            <h2 className="text-lg" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
              Customize
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Close">
            <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          <div>
            <p className="text-xs font-medium mb-3"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Active Widgets
            </p>
            {visible.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                No active widgets — add some below.
              </p>
            ) : (
              <div className="space-y-2">
                {visible.map((w, idx) => {
                  const meta = WIDGET_CATALOGUE.find(c => c.type === w.widgetType);
                  return (
                    <div key={w.widgetType} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: 'hsl(var(--muted))' }}>
                      <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      <span className="text-base flex-shrink-0">{meta?.icon}</span>
                      <span className="flex-1 text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {meta?.label ?? w.widgetType}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => move(w.widgetType, -1)} disabled={idx === 0}
                          className="p-1 rounded hover:bg-muted/80 disabled:opacity-30 transition-colors"
                          aria-label="Move up">
                          <ChevronUp className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        </button>
                        <button onClick={() => move(w.widgetType, 1)} disabled={idx === visible.length - 1}
                          className="p-1 rounded hover:bg-muted/80 disabled:opacity-30 transition-colors"
                          aria-label="Move down">
                          <ChevronDown className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        </button>
                        <button onClick={() => toggle(w.widgetType)}
                          className="p-1 rounded hover:bg-muted/80 transition-colors ml-1"
                          aria-label={`Remove ${meta?.label ?? w.widgetType}`}>
                          <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--destructive))' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {availableToAdd.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-3"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Add Widgets
              </p>
              <div className="space-y-2">
                {availableToAdd.map(w => (
                  <div key={w.type} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'hsl(var(--muted))' }}>
                    <span className="text-base flex-shrink-0">{w.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {w.label}
                      </p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {w.description}
                      </p>
                    </div>
                    <button onClick={() => addWidget(w.type)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}
                      aria-label={`Add ${w.label}`}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hidden.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-3"
                style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Hidden
              </p>
              <div className="space-y-2">
                {hidden.map(w => {
                  const meta = WIDGET_CATALOGUE.find(c => c.type === w.widgetType);
                  return (
                    <div key={w.widgetType} className="flex items-center gap-3 p-3 rounded-xl opacity-60"
                      style={{ background: 'hsl(var(--muted))' }}>
                      <span className="text-base flex-shrink-0">{meta?.icon}</span>
                      <span className="flex-1 text-sm" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        {meta?.label ?? w.widgetType}
                      </span>
                      <button onClick={() => toggle(w.widgetType)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}
                        aria-label={`Show ${meta?.label ?? w.widgetType}`}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 px-5 py-4" style={{ background: 'hsl(var(--card))', borderTop: '1px solid hsl(var(--border))' }}>
          <Button onClick={save} disabled={saving} className="w-full gap-2"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Layout'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Sign-in gate ──────────────────────────────────────────────────────────────
function SignInGate() {
  return (
    <main>
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <MoonNightSky moonPosition="top-right" moonSize={80} opacity={0.4} shootingStars />
        <TwinkleStars count={40} opacity={0.35} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-md mx-auto px-6 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-6"
            style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.4)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
            <Sparkles className="w-3 h-3" /> Your Personal Sanctuary
          </div>
          <h1 className="text-5xl mb-4" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
            Your Daily Sanctuary
          </h1>
          <p className="text-base mb-2 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            A fully personalized magical home — moon phases, tarot, your grimoire, cosmic events, and more, arranged exactly how you want them.
          </p>
          <p className="text-sm mb-8" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>
            Sign in to enter your sanctuary.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login?redirect=/dashboard">
              <Button size="lg" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                className="gap-2 w-full sm:w-auto">
                <Moon className="w-4 h-4" /> Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <Sparkles className="w-4 h-4" /> Create Account
              </Button>
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 text-left">
            {[
              { icon: '🌙', title: 'Moon Phases', desc: 'Accurate lunar data, rituals, and calendar' },
              { icon: '🃏', title: 'Daily Tarot', desc: 'Card of the day with full interpretation' },
              { icon: '📖', title: 'Living Grimoire', desc: 'Save readings, rituals, and reflections' },
              { icon: '⭐', title: 'Cosmic Events', desc: 'Upcoming celestial events in your timezone' },
            ].map(f => (
              <div key={f.title} className="p-3 rounded-xl" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <span className="text-xl">{f.icon}</span>
                <p className="text-sm font-medium mt-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>{f.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { session, isPending, isAuthenticated } = useSession();

  // SSR-safe daily data
  const [dailyData, setDailyData] = useState<DailyData>(() => getDailyData(new Date()));
  const [dateStr, setDateStr] = useState('');

  // Dashboard state
  const [prefs, setPrefs] = useState<DashboardPrefs | null>(null);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  // Sync daily data client-side
  useEffect(() => {
    const now = new Date();
    setDailyData(getDailyData(now));
    setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
  }, []);

  // Load preferences + widgets once authenticated
  useEffect(() => {
    if (isPending || !isAuthenticated) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch('/api/dashboard/preferences', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch('/api/dashboard/widgets', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ]).then(([p, w]) => {
      if (p) {
        setPrefs(p as DashboardPrefs);
        if (!(p as DashboardPrefs).onboardingComplete) setShowOnboarding(true);
      }
      if (w && Array.isArray(w) && (w as WidgetConfig[]).length > 0) {
        setWidgets(w as WidgetConfig[]);
      } else {
        setWidgets(DEFAULT_WIDGET_LAYOUT);
      }
      setLoading(false);
    }).catch(() => {
      setWidgets(DEFAULT_WIDGET_LAYOUT);
      setLoading(false);
    });
  }, [isPending, isAuthenticated]);

  const handleOnboardingComplete = useCallback((newPrefs: Partial<DashboardPrefs>) => {
    setPrefs(prev => ({
      ...(prev ?? { onboardingComplete: true, interests: [], theme: 'celestial', density: 'comfortable', dashboardTitle: '', timezone: 'UTC' }),
      ...newPrefs,
    }));
    setShowOnboarding(false);
    const theme = newPrefs.theme ?? 'celestial';
    const starterTypes = STARTER_LAYOUTS[theme] ?? STARTER_LAYOUTS.celestial;
    const starterWidgets: WidgetConfig[] = starterTypes.map((t, i) => ({
      widgetType: t, sortOrder: i, isVisible: true, settings: {},
    }));
    setWidgets(starterWidgets);
    fetch('/api/dashboard/widgets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(starterWidgets),
    }).catch(() => undefined);
  }, []);

  const handleWidgetSave = useCallback((updated: WidgetConfig[]) => {
    setWidgets(updated);
  }, []);

  const visibleWidgets = widgets
    .filter(w => w.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const compact = prefs?.density === 'compact';
  const greeting = session?.user?.name
    ? `Welcome back, ${session.user.name.split(' ')[0]}.`
    : 'Welcome back.';
  const title = prefs?.dashboardTitle || 'My Sanctuary';

  // Suppress unused import warning — dashboard content used for SEO
  void dashboard;

  if (!isPending && !isAuthenticated) return (
    <>
      <Helmet>
        <title>Your Daily Sanctuary — Spellful</title>
        <meta name="description" content="A personalized magical dashboard with moon phases, tarot, grimoire, and cosmic events." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <SignInGate />
    </>
  );

  return (
    <>
      <Helmet>
        <title>{title} — Spellful</title>
        <meta name="description" content="Your personalized magical sanctuary on Spellful." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
      {showCustomize && (
        <CustomizeDrawer
          widgets={widgets}
          onSave={handleWidgetSave}
          onClose={() => setShowCustomize(false)}
        />
      )}

      <main>
        {/* ── Hero ── */}
        <section className="relative py-14 md:py-20 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, hsl(var(--card-deep)) 0%, hsl(var(--background)) 100%)' }}>
          <MoonNightSky moonPosition="top-right" moonSize={56} opacity={0.4} shootingStars />
          <TwinkleStars count={25} opacity={0.35} />
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {dateStr}
              </p>
              <h1 className="text-4xl md:text-5xl mb-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                {title}
              </h1>
              <p className="text-base" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>
                {greeting}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Button
                onClick={() => setShowCustomize(true)}
                variant="outline"
                className="gap-2 text-sm"
                aria-label="Customize dashboard"
              >
                <Settings2 className="w-4 h-4" />
                Customize
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ── Widget grid ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 pt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonWidget key={i} />)}
            </div>
          ) : visibleWidgets.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
              <Wand2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--primary))' }} />
              <h2 className="text-2xl mb-2" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                Your sanctuary awaits
              </h2>
              <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Add widgets to build your personalized magical home.
              </p>
              <Button onClick={() => setShowCustomize(true)}
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                className="gap-2">
                <Plus className="w-4 h-4" /> Add Widgets
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {visibleWidgets.map((w, i) => (
                <motion.div
                  key={w.widgetType}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <RenderWidget type={w.widgetType} data={dailyData} compact={compact} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick-start guidance for new users — dismissible, below protected section */}
        <QuickStartChips />
      </main>
    </>
  );
}
