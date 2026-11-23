import { calendar } from 'virtual:content';
import { useState, useMemo } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { useSession } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Moon,
  Sparkles,
  Star,
  Zap,
  Sun,
  Clock,
} from 'lucide-react';
import { getUpcomingEvents, type AstroEvent } from '@/lib/astro-feed';
import { getDailyCard, getDailyAffirmation } from '@/lib/daily-dashboard-data';
import { getCurrentMoonPhase } from '@/lib/moon-ritual-data';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMoonEmoji(phase: string): string {
  const map: Record<string, string> = {
    'new_moon': '🌑', 'waxing_crescent': '🌒', 'first_quarter': '🌓',
    'waxing_gibbous': '🌔', 'full_moon': '🌕', 'waning_gibbous': '🌖',
    'last_quarter': '🌗', 'waning_crescent': '🌘',
  };
  // eslint-disable-next-line security/detect-object-injection
  return map[phase] ?? '🌙'; // safe: phase is a typed moon phase string
}

function formatMoonPhase(phase: string): string {
  return phase.replace(/_/g, ' ').replace(/w/g, (c) => c.toUpperCase());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  moon:    { color: 'hsl(var(--astro-moon))',    icon: <Moon size={11} />,     label: 'Moon' },
  planet:  { color: 'hsl(var(--astro-mercury))', icon: <Zap size={11} />,      label: 'Planet' },
  sun:     { color: 'hsl(var(--astro-sun))',     icon: <Sun size={11} />,      label: 'Sun' },
  eclipse: { color: 'hsl(var(--astro-mars))',    icon: <Star size={11} />,     label: 'Eclipse' },
  sabbat:  { color: 'hsl(var(--primary))',       icon: <Sparkles size={11} />, label: 'Sabbat' },
};

// ─── Day Cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  date: Date;
  events: AstroEvent[];
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  onClick: () => void;
}

function DayCell({ date, events, isToday, isSelected, isCurrentMonth, onClick }: DayCellProps) {
  const moonEvents = events.filter((e) => e.category === 'moon');
  const otherEvents = events.filter((e) => e.category !== 'moon');
  const moonGlyph = moonEvents[0]?.glyph;

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full aspect-square rounded-lg p-1 text-left transition-all duration-150
        ${isSelected ? 'ring-2 ring-primary bg-primary/20' : 'hover:bg-muted/60'}
        ${isToday ? 'bg-primary/10' : ''}
        ${!isCurrentMonth ? 'opacity-30' : ''}
      `}
    >
      <span
        className={`text-xs font-medium block leading-none mb-1 ${
          isToday ? 'text-primary font-bold' : 'text-foreground'
        }`}
      >
        {date.getDate()}
      </span>
      {moonGlyph && (
        <span className="text-xs leading-none block" title={moonEvents[0]?.label}>
          {moonGlyph}
        </span>
      )}
      {otherEvents.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {otherEvents.slice(0, 2).map((e, i) => {
            const cfg = CATEGORY_CONFIG[e.category];
            return (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: cfg?.color ?? 'hsl(var(--muted-foreground))' }}
                title={e.label}
              />
            );
          })}
        </div>
      )}
    </button>
  );
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

interface DayDetailProps {
  date: Date;
  events: AstroEvent[];
}

function DayDetail({ date, events }: DayDetailProps) {
  const isToday = isSameDay(date, new Date());
  const moonPhaseData = getCurrentMoonPhase(date);
  const moonPhase = moonPhaseData.phase;
  const moonEmoji = getMoonEmoji(moonPhase);

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Daily content (only for today)
  const dailyCard = isToday ? getDailyCard(date) : null;
  const affirmation = isToday ? getDailyAffirmation(date) : null;

  const JOURNAL_PROMPTS = [
    'What intention do you want to set for this lunar cycle?',
    'What are you ready to release and let go of?',
    'Where in your life do you feel most aligned right now?',
    'What is your intuition telling you today?',
    'What small act of magic can you bring to this day?',
    'How is the current celestial energy reflecting in your life?',
    'What are you grateful for in this moment?',
  ];
  const promptIdx = Math.abs(date.getDate() + date.getMonth() * 31) % JOURNAL_PROMPTS.length;
  // eslint-disable-next-line security/detect-object-injection
  const journalPrompt = JOURNAL_PROMPTS[promptIdx];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-serif text-lg text-foreground">{formattedDate}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {moonEmoji} {formatMoonPhase(moonPhase)}
        </p>
      </div>

      {/* Celestial events */}
      {events.length > 0 ? (
        <div className="space-y-2">
          {events.map((e, i) => {
            const cfg = CATEGORY_CONFIG[e.category];
            return (
              <div
                key={i}
                className="rounded-lg p-3 border"
                style={{ borderColor: `${cfg?.color ?? 'hsl(var(--border))'}44`, backgroundColor: `${cfg?.color ?? 'hsl(var(--muted))'}11` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: cfg?.color }}>{e.glyph}</span>
                  <span className="font-semibold text-sm text-foreground">{e.label}</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full ml-auto"
                    style={{ backgroundColor: `${cfg?.color ?? 'hsl(var(--muted))'}22`, color: cfg?.color }}
                  >
                    {cfg?.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{e.detail}</p>
                {e.practices.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Suggested practices:</p>
                    <ul className="space-y-0.5">
                      {e.practices.slice(0, 3).map((p, pi) => (
                        <li key={pi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">✦</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">{calendar.noEvents}</p>
      )}

      {/* Today's cosmic weather */}
      {isToday && (
        <div className="border-t border-border pt-4 space-y-3">
          <h4 className="font-semibold text-sm text-foreground">{calendar.dailyWeather.heading}</h4>

          {affirmation && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">{calendar.dailyWeather.affirmationLabel}</p>
              <p className="text-sm text-foreground italic">"{affirmation}"</p>
            </div>
          )}

          {dailyCard && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">{calendar.dailyWeather.tarotLabel}</p>
              <p className="text-sm text-foreground">
                {dailyCard.card.name}
                {dailyCard.reversed && <span className="text-muted-foreground text-xs ml-1">(Reversed)</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{dailyCard.card.keywords.slice(0, 3).join(' · ')}</p>
            </div>
          )}

          {journalPrompt && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">{calendar.dailyWeather.journalLabel}</p>
              <p className="text-sm text-foreground">{journalPrompt}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { session } = useSession();
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Compute all events for a 3-month window around the current view
  const allEvents = useMemo(() => {
    const from = new Date(viewYear, viewMonth - 1, 1);
    return getUpcomingEvents(from, 120);
  }, [viewYear, viewMonth]);

  // Build a map: "YYYY-MM-DD" → AstroEvent[]
  const eventMap = useMemo(() => {
    const map = new Map<string, AstroEvent[]>();
    for (const e of allEvents) {
      const key = e.date.toISOString().slice(0, 10);
      const existing = map.get(key) ?? [];
      existing.push(e);
      map.set(key, existing);
    }
    return map;
  }, [allEvents]);

  function getEventsForDate(date: Date): AstroEvent[] {
    const key = date.toISOString().slice(0, 10);
    return eventMap.get(key) ?? [];
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  }

  // Build calendar grid
  const firstDay = startOfMonth(viewYear, viewMonth);
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDow = firstDay.getDay(); // 0=Sun

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(viewYear, viewMonth, d));

  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedEvents = getEventsForDate(selectedDate);

  return (
    <>
      <Helmet>
        <title>Free Moon Phase Calendar 2026 — Eclipses, Retrogrades & Sabbats | Spellful</title>
        <meta name="description" content="Free moon phase calendar with full moons, new moons, eclipses, planetary retrogrades, and pagan sabbats. No signup needed. Better than Co-Star for witches and pagans." />
        <link rel="canonical" href="https://spellful.com/calendar" />
        <meta property="og:title" content="Free Moon Phase Calendar — Eclipses, Retrogrades & Sabbats | Spellful" />
        <meta property="og:description" content="Free moon phase calendar with full moons, new moons, eclipses, retrogrades, and sabbats. No signup, no ads." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/calendar" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
      </Helmet>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <CalendarDays className="text-primary" size={28} />
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">
              {calendar.hero.title}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {calendar.hero.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="text-muted-foreground hover:text-foreground">
                  <ChevronLeft size={18} />
                </Button>
                <h2 className="font-serif text-xl text-foreground">{monthName}</h2>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="text-muted-foreground hover:text-foreground">
                  <ChevronRight size={18} />
                </Button>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((date, i) =>
                  date ? (
                    <DayCell
                      key={i}
                      date={date}
                      events={getEventsForDate(date)}
                      isToday={isSameDay(date, today)}
                      isSelected={isSameDay(date, selectedDate)}
                      isCurrentMonth={date.getMonth() === viewMonth}
                      onClick={() => setSelectedDate(date)}
                    />
                  ) : (
                    <div key={i} />
                  )
                )}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground font-semibold mb-2">{calendar.legend.heading}</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span style={{ color: cfg.color }}>{cfg.icon}</span>
                      <span className="text-xs text-muted-foreground">{cfg.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming events strip */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                Upcoming This Month
              </h3>
              <div className="space-y-2">
                {allEvents
                  .filter((e) => e.date.getFullYear() === viewYear && e.date.getMonth() === viewMonth)
                  .slice(0, 8)
                  .map((e, i) => {
                    const cfg = CATEGORY_CONFIG[e.category];
                    const dayStr = e.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(new Date(e.date.getFullYear(), e.date.getMonth(), e.date.getDate()))}
                        className="w-full flex items-center gap-3 text-left hover:bg-muted/50 rounded-lg px-2 py-1.5 transition-colors"
                      >
                        <span className="text-base w-6 text-center">{e.glyph}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{e.label}</p>
                          <p className="text-xs text-muted-foreground">{dayStr}</p>
                        </div>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: `${cfg?.color ?? 'hsl(var(--muted))'}22`, color: cfg?.color }}
                        >
                          {cfg?.label}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Day detail panel */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-4 sticky top-24">
              <DayDetail date={selectedDate} events={selectedEvents} />

              {/* Personal timeline link */}
              {session && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">{calendar.personalLabel}</p>
                  <Link to="/timeline">
                    <Button variant="outline" size="sm" className="w-full border-border text-muted-foreground hover:text-foreground gap-2">
                      <Star size={13} />
                      <span>{calendar.addPersonalCta}</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
