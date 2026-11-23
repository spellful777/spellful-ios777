import { timeline } from 'virtual:content';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '@/lib/auth/auth-client';
import { getMoonPhase } from '@/lib/moon-phase-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Clock,
  Plus,
  Search,
  Trash2,
  Edit3,
  Sparkles,
  Moon,
  ScrollText,
  CloudMoon,
  NotebookPen,
  Heart,
  Star,
  X,
  Download,
  Filter,
  Calendar,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimelineEntry {
  id: number;
  userId: string;
  type: string;
  title: string;
  content: string;
  tags: string;
  moonPhase: string;
  eventDate: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

const ENTRY_TYPES = [
  { value: 'milestone', label: 'Milestone', icon: Star, colorVar: '--primary' },
  { value: 'journal', label: 'Journal', icon: NotebookPen, colorVar: '--muted-foreground' },
  { value: 'tarot', label: 'Tarot', icon: ScrollText, colorVar: '--grimoire-tarot' },
  { value: 'ritual', label: 'Ritual', icon: Sparkles, colorVar: '--grimoire-ritual' },
  { value: 'dream', label: 'Dream', icon: CloudMoon, colorVar: '--grimoire-dream' },
  { value: 'relationship', label: 'Relationship', icon: Heart, colorVar: '--astro-venus' },
] as const;

function getTypeConfig(type: string) {
  return ENTRY_TYPES.find((t) => t.value === type) ?? ENTRY_TYPES[1];
}

function typeColor(colorVar: string) {
  return `hsl(var(${colorVar}))`;
}

// ─── Moon phase for a given date (algorithmic) ────────────────────────────────
// Uses moon-phase-engine.ts (Meeus Ch. 47 elongation bisection) — the single
// source of truth for all lunar calculations on Spellful.

function getMoonPhaseForDate(dateStr: string): string {
  // Parse as noon UTC so the date is unambiguous across timezones
  const date = new Date(dateStr + 'T12:00:00Z');
  return getMoonPhase(date).phase;
}

function getMoonEmoji(phase: string): string {
  const map: Record<string, string> = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘',
  };
  // eslint-disable-next-line security/detect-object-injection
  return map[phase] ?? '🌙'; // safe: phase is a typed moon phase string
}

// ─── "On This Day" helper ─────────────────────────────────────────────────────

function isOnThisDay(entry: TimelineEntry): boolean {
  const today = new Date();
  const entryDate = new Date(entry.eventDate + 'T12:00:00');
  return (
    entryDate.getMonth() === today.getMonth() &&
    entryDate.getDate() === today.getDate() &&
    entryDate.getFullYear() !== today.getFullYear()
  );
}

// ─── Export helper ────────────────────────────────────────────────────────────

function exportEntries(entries: TimelineEntry[]) {
  const lines = entries.map((e) => {
    const cfg = getTypeConfig(e.type);
    return `${e.eventDate} [${cfg.label}] ${e.title}\n${e.content}${e.tags ? `\nTags: ${e.tags}` : ''}${e.moonPhase ? `\nMoon: ${e.moonPhase}` : ''}\n`;
  });
  const blob = new Blob([lines.join('\n---\n\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cosmic-timeline.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Entry Card ───────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: TimelineEntry;
  onEdit: (entry: TimelineEntry) => void;
  onDelete: (id: number) => void;
  isOnThisDayEntry: boolean;
}

function EntryCard({ entry, onEdit, onDelete, isOnThisDayEntry }: EntryCardProps) {
  const cfg = getTypeConfig(entry.type);
  const Icon = cfg.icon;
  const color = typeColor(cfg.colorVar);
  const tags = entry.tags ? entry.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const dateObj = new Date(entry.eventDate + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="relative flex gap-4"
    >
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2"
          style={{ borderColor: color, backgroundColor: `${color}22` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div className="w-px flex-1 mt-2" style={{ backgroundColor: `${color}33` }} />
      </div>

      {/* Card */}
      <div
        className="flex-1 mb-6 rounded-xl border p-4 bg-card"
        style={{ borderColor: `${color}44` }}
      >
        {isOnThisDayEntry && (
          <div
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-2"
            style={{ backgroundColor: `${color}22`, color }}
          >
            <Star size={10} />
            On This Day
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}22`, color }}
              >
                {cfg.label}
              </span>
              {entry.moonPhase && (
                <span className="text-xs text-muted-foreground">
                  {getMoonEmoji(entry.moonPhase)} {entry.moonPhase}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground leading-tight">{entry.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Calendar size={11} />
              {formattedDate}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Edit entry"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
              aria-label="Delete entry"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <p className="text-sm text-card-foreground mt-2 leading-relaxed whitespace-pre-wrap">
          {entry.content}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Entry Form ───────────────────────────────────────────────────────────────

interface EntryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editing: TimelineEntry | null;
}

function EntryForm({ open, onClose, onSave, editing }: EntryFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState('milestone');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [eventDate, setEventDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setTitle(editing.title);
      setContent(editing.content);
      setTags(editing.tags ?? '');
      setEventDate(editing.eventDate);
    } else {
      setType('milestone');
      setTitle('');
      setContent('');
      setTags('');
      setEventDate(today);
    }
    setError('');
  }, [editing, open, today]);

  const moonPhase = eventDate ? getMoonPhaseForDate(eventDate) : '';

  async function handleSave() {
    if (!title.trim() || !content.trim() || !eventDate) {
      setError('Title, content, and date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/timeline/${editing.id}` : '/api/timeline';
      const method = editing ? 'PUT' : 'POST';
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title: title.trim(), content: content.trim(), tags, moonPhase, eventDate }),
      });
      if (!resp.ok) throw new Error('Save failed');
      onSave();
      onClose();
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground">
            {editing ? 'Edit Entry' : 'Add to Your Timeline'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {ENTRY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Date</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>

          {moonPhase && (
            <p className="text-xs text-muted-foreground">
              {getMoonEmoji(moonPhase)} Moon on this date: <span className="text-accent">{moonPhase}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name this moment..."
              className="bg-muted border-border text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Reflection</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What happened? How did it feel? What did you learn?"
              rows={5}
              className="bg-muted border-border text-foreground resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Tags (comma-separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="growth, love, career..."
              className="bg-muted border-border text-foreground"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? 'Saving...' : editing ? 'Update Entry' : 'Add to Timeline'}
            </Button>
            <Button variant="outline" onClick={onClose} className="border-border">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const { session, isPending } = useSession();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEntry | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      void navigate('/login');
    }
  }, [session, isPending, navigate]);

  const fetchEntries = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (search) params.set('search', search);
      const resp = await fetch(`/api/timeline?${params.toString()}`);
      if (resp.ok) {
        const data = (await resp.json()) as TimelineEntry[];
        setEntries(data);
      }
    } finally {
      setLoading(false);
    }
  }, [session, typeFilter, search]);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  async function handleDelete(id: number) {
    await fetch(`/api/timeline/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    void fetchEntries();
  }

  function openEdit(entry: TimelineEntry) {
    setEditing(entry);
    setFormOpen(true);
  }

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  // Group entries by year
  const grouped: Record<string, TimelineEntry[]> = {};
  for (const entry of entries) {
    const year = entry.eventDate.slice(0, 4);
    // eslint-disable-next-line security/detect-object-injection
    if (!grouped[year]) grouped[year] = []; // safe: year is a numeric string from Date.getFullYear()
    // eslint-disable-next-line security/detect-object-injection
    grouped[year].push(entry);
  }
  const years = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));

  // "On This Day" entries
  const onThisDayEntries = entries.filter(isOnThisDay);

  if (isPending) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cosmic Life Timeline — Spellful</title>
        <meta name="description" content="Your private timeline of life milestones, rituals, dreams, and reflections — overlaid with the moon phases that witnessed them." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Clock className="text-primary" size={28} />
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">
              {timeline.hero.title}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {timeline.hero.subtitle}
          </p>
        </motion.div>

        {/* On This Day */}
        <AnimatePresence>
          {onThisDayEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 rounded-xl border border-primary/30 bg-primary/10 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Star className="text-primary" size={16} />
                <h2 className="font-semibold text-primary text-sm">{timeline.onThisDay.heading}</h2>
              </div>
              <div className="space-y-2">
                {onThisDayEntries.map((e) => {
                  const cfg = getTypeConfig(e.type);
                  return (
                    <div key={e.id} className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                        {e.eventDate.slice(0, 4)}
                      </span>
                      <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: `${typeColor(cfg.colorVar)}22`, color: typeColor(cfg.colorVar) }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-sm text-foreground">{e.title}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your timeline..."
              className="pl-9 bg-muted border-border text-foreground"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 bg-muted border-border">
                <Filter size={13} className="mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All types</SelectItem>
                {ENTRY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {entries.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => exportEntries(entries)}
                className="border-border text-muted-foreground hover:text-foreground"
                title="Export timeline"
              >
                <Download size={15} />
              </Button>
            )}

            <Button
              onClick={openNew}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              <Plus size={15} />
              Add
            </Button>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Moon className="mx-auto mb-4 text-muted-foreground" size={40} />
            <h2 className="font-serif text-2xl text-foreground mb-2">{timeline.empty.title}</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {search || typeFilter !== 'all'
                ? 'No entries match your search. Try different filters.'
                : timeline.empty.subtitle}
            </p>
            {!search && typeFilter === 'all' && (
              <Button
                onClick={openNew}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                <Plus size={15} />
                <span>{timeline.empty.cta}</span>
              </Button>
            )}
          </motion.div>
        ) : (
          <div>
            {years.map((year) => (
              <div key={year} className="mb-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="font-serif text-lg text-primary font-semibold">{year}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <AnimatePresence>
                  {/* eslint-disable-next-line security/detect-object-injection */}
                  {grouped[year].map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={openEdit}
                      onDelete={(id) => setDeleteId(id)}
                      isOnThisDayEntry={isOnThisDay(entry)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Entry form dialog */}
      <EntryForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={fetchEntries}
        editing={editing}
      />

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove the entry from your timeline. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId !== null && void handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
