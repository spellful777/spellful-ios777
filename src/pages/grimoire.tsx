import { grimoire } from 'virtual:content';
import { useState, useEffect, useCallback } from 'react';
import { GrimoireOnboarding, GrimoireWelcomeFlow, useGrimoireWelcome } from '@/components/GrimoireOnboarding';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '@/lib/auth/auth-client';
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
  BookOpen,
  Plus,
  Search,
  Star,
  Trash2,
  Edit3,
  Heart,
  Sparkles,
  Moon,
  Leaf,
  Gem,
  FlameKindling,
  ScrollText,
  CloudMoon,
  NotebookPen,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SavedSpell {
  saveId: number;
  savedAt: string | null;
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  intention: string;
  difficulty: string;
  durationMinutes: number;
  moonPhase: string;
  saveCount: number;
  ratingCount: number;
  ratingSum: number;
  isFeatured: boolean;
}

interface GrimoireEntry {
  id: number;
  userId: string;
  type: string;
  title: string;
  content: string;
  notes: string;
  tags: string;
  category: string;
  isFavorite: boolean;
  moonPhase: string;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

const ENTRY_TYPES = [
  { value: 'spell', label: 'Spell', icon: Sparkles, colorVar: '--primary' },
  { value: 'herb', label: 'Herb', icon: Leaf, colorVar: '--grimoire-herb' },
  { value: 'crystal', label: 'Crystal', icon: Gem, colorVar: '--accent' },
  { value: 'ritual', label: 'Ritual', icon: FlameKindling, colorVar: '--grimoire-ritual' },
  { value: 'tarot', label: 'Tarot', icon: ScrollText, colorVar: '--grimoire-tarot' },
  { value: 'dream', label: 'Dream', icon: CloudMoon, colorVar: '--grimoire-dream' },
  { value: 'journal', label: 'Journal', icon: NotebookPen, colorVar: '--muted-foreground' },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTypeConfig(type: string) {
  return ENTRY_TYPES.find((t) => t.value === type) ?? ENTRY_TYPES[6];
}

function typeColor(colorVar: string) {
  return `hsl(var(${colorVar}))`;
}

function formatDate(iso: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <BookOpen className="w-9 h-9" style={{ color: 'hsl(var(--primary))' }} />
      </div>
      <h2
        className="text-2xl mb-3"
        style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
      >
        {grimoire.emptyState.title}
      </h2>
      <p className="mb-8 max-w-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
        {grimoire.emptyState.description}
      </p>
      <Button
        onClick={onAdd}
        className="gap-2"
        style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
      >
        <Plus className="w-4 h-4" />
        {grimoire.emptyState.cta}
      </Button>
    </motion.div>
  );
}

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  entry: GrimoireEntry;
  onEdit: (e: GrimoireEntry) => void;
  onDelete: (id: number) => void;
  onToggleFavorite: (id: number, current: boolean) => void;
}) {
  const cfg = getTypeConfig(entry.type);
  const Icon = cfg.icon;
  const color = typeColor(cfg.colorVar);
  const tags = entry.tags ? entry.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl p-5 flex flex-col gap-3 group relative"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `hsl(var(${cfg.colorVar}) / 0.13)`, border: `1px solid hsl(var(${cfg.colorVar}) / 0.27)` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p
              className="text-xs uppercase tracking-widest mb-0.5"
              style={{ color, fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}
            >
              {cfg.label}
            </p>
            <h3
              className="font-semibold leading-tight truncate"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))', fontSize: '1.05rem' }}
            >
              {entry.title}
            </h3>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleFavorite(entry.id, entry.isFavorite)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: entry.isFavorite ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
            aria-label={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className="w-4 h-4" fill={entry.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded-lg transition-colors hover:text-foreground"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            aria-label="Edit entry"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--destructive))'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--muted-foreground))'; }}
            aria-label="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content preview */}
      <p
        className="text-sm line-clamp-3 leading-relaxed"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
      >
        {entry.content}
      </p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              +{tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {entry.moonPhase ? (
          <span
            className="flex items-center gap-1 text-xs"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
          >
            <Moon className="w-3 h-3" />
            {entry.moonPhase}
          </span>
        ) : (
          <span />
        )}
        <span
          className="text-xs"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
        >
          {formatDate(entry.entryDate || entry.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Entry Form Dialog ────────────────────────────────────────────────────────

interface EntryFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<GrimoireEntry>) => Promise<void>;
  initial?: GrimoireEntry | null;
}

function EntryFormDialog({ open, onClose, onSave, initial }: EntryFormProps) {
  const [type, setType] = useState(initial?.type ?? 'journal');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [tags, setTags] = useState(initial?.tags ?? '');
  const [moonPhase, setMoonPhase] = useState(initial?.moonPhase ?? '');
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setType(initial?.type ?? 'journal');
      setTitle(initial?.title ?? '');
      setContent(initial?.content ?? '');
      setNotes(initial?.notes ?? '');
      setTags(initial?.tags ?? '');
      setMoonPhase(initial?.moonPhase ?? '');
      setIsFavorite(initial?.isFavorite ?? false);
      setError('');
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError(grimoire.form.errorRequired);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ type, title: title.trim(), content: content.trim(), notes, tags, moonPhase, isFavorite });
      onClose();
    } catch {
      setError(grimoire.form.errorSave);
    } finally {
      setSaving(false);
    }
  }

  const isEditing = !!initial;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))', fontSize: '1.4rem' }}>
            {isEditing ? grimoire.form.editTitle : grimoire.form.newTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* Type selector */}
          <div className="flex flex-col gap-1.5">
            <Label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{grimoire.form.typeLabel}</Label>
            <div className="grid grid-cols-4 gap-2">
              {ENTRY_TYPES.map((t) => {
                const TIcon = t.icon;
                const active = type === t.value;
                const tColor = typeColor(t.colorVar);
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all"
                    style={{
                      background: active ? `hsl(var(${t.colorVar}) / 0.13)` : 'hsl(var(--muted))',
                      border: `1px solid ${active ? tColor : 'hsl(var(--border))'}`,
                      color: active ? tColor : 'hsl(var(--muted-foreground))',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <TIcon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-title" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{grimoire.form.titleLabel}</Label>
            <Input
              id="entry-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name your entry..."
              required
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-content" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{grimoire.form.contentLabel}</Label>
            <Textarea
              id="entry-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your entry here..."
              rows={5}
              required
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-notes" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
              {grimoire.form.notesLabel} <span style={{ color: 'hsl(var(--muted-foreground))' }}>{grimoire.form.notesOptional}</span>
            </Label>
            <Textarea
              id="entry-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private observations, results, reflections..."
              rows={2}
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-tags" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
              {grimoire.form.tagsLabel} <span style={{ color: 'hsl(var(--muted-foreground))' }}>{grimoire.form.tagsOptional}</span>
            </Label>
            <Input
              id="entry-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="protection, love, moon magic..."
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            />
          </div>

          {/* Moon Phase */}
          <div className="flex flex-col gap-1.5">
            <Label style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{grimoire.form.moonPhaseLabel}</Label>
            <Select value={moonPhase} onValueChange={setMoonPhase}>
              <SelectTrigger style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                <SelectValue placeholder="Select moon phase..." />
              </SelectTrigger>
              <SelectContent style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <SelectItem value="New Moon" style={{ color: 'hsl(var(--foreground))' }}>New Moon</SelectItem>
                <SelectItem value="Waxing Crescent" style={{ color: 'hsl(var(--foreground))' }}>Waxing Crescent</SelectItem>
                <SelectItem value="First Quarter" style={{ color: 'hsl(var(--foreground))' }}>First Quarter</SelectItem>
                <SelectItem value="Waxing Gibbous" style={{ color: 'hsl(var(--foreground))' }}>Waxing Gibbous</SelectItem>
                <SelectItem value="Full Moon" style={{ color: 'hsl(var(--foreground))' }}>Full Moon</SelectItem>
                <SelectItem value="Waning Gibbous" style={{ color: 'hsl(var(--foreground))' }}>Waning Gibbous</SelectItem>
                <SelectItem value="Last Quarter" style={{ color: 'hsl(var(--foreground))' }}>Last Quarter</SelectItem>
                <SelectItem value="Waning Crescent" style={{ color: 'hsl(var(--foreground))' }}>Waning Crescent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Favorite toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-1 rounded transition-colors"
              style={{ color: isFavorite ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
            >
              <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <span style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>
              {grimoire.form.favoriteLabel}
            </span>
          </label>

          {error && (
            <p className="text-sm" style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              {grimoire.form.cancelButton}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              {saving ? grimoire.form.savingText : isEditing ? grimoire.form.saveButton : grimoire.form.addButton}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GrimoirePage() {
  const { session, isPending } = useSession();
  const isAuthenticated = !!session;
  const { show: showWelcome, dismiss: dismissWelcome } = useGrimoireWelcome(isAuthenticated);

  const [entries, setEntries] = useState<GrimoireEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<GrimoireEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Saved spells from spell library
  const [savedSpells, setSavedSpells] = useState<SavedSpell[]>([]);
  const [savedSpellsLoading, setSavedSpellsLoading] = useState(false);
  const [showSavedSpells, setShowSavedSpells] = useState(false);

  // Show onboarding for unauthenticated visitors instead of redirecting
  const showOnboarding = !isPending && !session;

  const fetchEntries = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.set('type', filterType);
      if (showFavorites) params.set('favorites', 'true');
      if (search) params.set('search', search);
      params.set('page', String(pageNum));
      const res = await fetch(`/api/grimoire?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { entries: GrimoireEntry[]; pagination: { hasMore: boolean; total: number; page: number } };
        // Handle both old array response and new paginated response
        if (Array.isArray(data)) {
          setEntries(data as unknown as GrimoireEntry[]);
          setHasMore(false);
          setTotal((data as unknown as GrimoireEntry[]).length);
        } else {
          setEntries(append ? (prev) => [...prev, ...data.entries] : data.entries);
          setHasMore(data.pagination.hasMore);
          setTotal(data.pagination.total);
          setPage(data.pagination.page);
        }
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filterType, showFavorites, search]);

  useEffect(() => {
    if (session) fetchEntries(1, false);
  }, [session, fetchEntries]);

  useEffect(() => {
    if (!session) return;
    setSavedSpellsLoading(true);
    fetch('/api/spells/saved', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { spells: [] })
      .then((data: { spells?: SavedSpell[] }) => setSavedSpells(data.spells ?? []))
      .catch(() => {})
      .finally(() => setSavedSpellsLoading(false));
  }, [session]);

  const handleLoadMore = useCallback(() => {
    fetchEntries(page + 1, true);
  }, [fetchEntries, page]);

  async function handleSave(data: Partial<GrimoireEntry>) {
    if (editingEntry) {
      await fetch(`/api/grimoire/${editingEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
    } else {
      await fetch('/api/grimoire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
    }
    setEditingEntry(null);
    await fetchEntries(1, false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/grimoire/${id}`, { method: 'DELETE', credentials: 'include' });
    setDeleteConfirm(null);
    await fetchEntries(1, false);
  }

  async function handleToggleFavorite(id: number, current: boolean) {
    await fetch(`/api/grimoire/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isFavorite: !current }),
    });
    await fetchEntries(1, false);
  }

  function openNew() {
    setEditingEntry(null);
    setDialogOpen(true);
  }

  function openEdit(entry: GrimoireEntry) {
    setEditingEntry(entry);
    setDialogOpen(true);
  }

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: 'hsl(var(--primary))' }}
        />
      </main>
    );
  }

  if (showOnboarding) return <GrimoireOnboarding />;

  // Authenticated welcome flow — rendered as overlay after the page mounts

  const totalCount = total || entries.length;
  const favCount = entries.filter((e) => e.isFavorite).length;

  return (
    <>
      <Helmet>
        <title>My Grimoire — Spellful</title>
        <meta name="description" content="Your personal Book of Shadows. Record spells, herbs, crystals, rituals, tarot readings, dreams, and journal entries." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen pb-20" style={{ background: 'hsl(var(--background))' }}>
        {/* Hero header */}
        <div
          className="relative py-16 px-4 text-center overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, hsl(var(--card)), hsl(var(--background)))' }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                left: `${(i * 37 + 11) % 100}%`,
                top: `${(i * 53 + 7) % 100}%`,
                background: i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))',
                opacity: 0.4 + (i % 4) * 0.15,
              }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
            />
          ))}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.3)' }}
            >
              <BookOpen className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <h1
              className="text-4xl md:text-5xl mb-3"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {grimoire.hero.title}
            </h1>
            <p style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              {grimoire.hero.subtitle}
            </p>

            {totalCount > 0 && (
              <div className="flex items-center justify-center gap-6 mt-5">
                <div className="text-center">
                  <p className="text-2xl font-semibold" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-heading)' }}>
                    {totalCount}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {totalCount === 1 ? grimoire.stats.entryLabel : grimoire.stats.entriesLabel}
                  </p>
                </div>
                <div className="w-px h-8" style={{ background: 'hsl(var(--border))' }} />
                <div className="text-center">
                  <p className="text-2xl font-semibold" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-heading)' }}>
                    {favCount}
                  </p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    {grimoire.stats.favoritesLabel}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your grimoire..."
                className="pl-9"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm"
              style={{
                background: showFavorites ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--card))',
                border: `1px solid ${showFavorites ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                color: showFavorites ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Heart className="w-4 h-4" fill={showFavorites ? 'currentColor' : 'none'} />
              {grimoire.toolbar.favoritesButton}
            </button>

            <Button
              onClick={openNew}
              className="gap-2 shrink-0"
              style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              <Plus className="w-4 h-4" />
              {grimoire.toolbar.newEntryButton}
            </Button>
          </div>

          {/* Type filter tabs */}
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setFilterType('all')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all"
              style={{
                background: filterType === 'all' ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                color: filterType === 'all' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                border: `1px solid ${filterType === 'all' ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              {grimoire.filterAll}
            </button>
            {ENTRY_TYPES.map((t) => {
              const TIcon = t.icon;
              const active = filterType === t.value;
              const tColor = typeColor(t.colorVar);
              return (
                <button
                  key={t.value}
                  onClick={() => setFilterType(t.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all"
                  style={{
                    background: active ? `hsl(var(${t.colorVar}) / 0.13)` : 'hsl(var(--card))',
                    color: active ? tColor : 'hsl(var(--muted-foreground))',
                    border: `1px solid ${active ? tColor : 'hsl(var(--border))'}`,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <TIcon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* ── Saved Spells from Spell Library ── */}
          {isAuthenticated && savedSpells.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowSavedSpells(v => !v)}
                className="flex items-center gap-2 w-full text-left mb-3 group"
              >
                <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                <span className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                  Saved Spells
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full ml-1" style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                  {savedSpells.length}
                </span>
                <span className="ml-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {showSavedSpells ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              <AnimatePresence>
                {showSavedSpells && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
                      {savedSpells.map((sp) => (
                        <Link
                          key={sp.saveId}
                          to={`/spells/${sp.slug}`}
                          className="flex flex-col gap-1.5 p-3 rounded-xl transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        >
                          <p className="text-sm font-medium line-clamp-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)' }}>
                            {sp.title}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                              {sp.intention}
                            </span>
                            <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                              {sp.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-xs ml-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              <Clock className="w-3 h-3" />
                              {sp.durationMinutes} min
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {isAuthenticated && savedSpellsLoading && (
            <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 border border-t-transparent rounded-full" style={{ borderColor: 'hsl(var(--primary))' }} />
              Loading saved spells…
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-t-transparent rounded-full"
                style={{ borderColor: 'hsl(var(--primary))' }}
              />
            </div>
          ) : entries.length === 0 ? (
            <EmptyState onAdd={openNew} />
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={openEdit}
                    onDelete={(id) => setDeleteConfirm(id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex flex-col items-center gap-2 pt-6">
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Showing {entries.length} of {totalCount} entries
              </p>
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="gap-2"
                style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                {loadingMore ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-t-transparent rounded-full inline-block"
                    style={{ borderColor: 'hsl(var(--primary))' }}
                  />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Entry form dialog */}
      <EntryFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingEntry(null); }}
        onSave={handleSave}
        initial={editingEntry}
      />

      {/* Delete confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(v) => { if (!v) setDeleteConfirm(null); }}>
        <DialogContent
          className="max-w-sm"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {grimoire.deleteDialog.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {grimoire.deleteDialog.description}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1"
              style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              {grimoire.deleteDialog.cancelButton}
            </Button>
            <Button
              onClick={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
              className="flex-1"
              style={{ background: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }}
            >
              {grimoire.deleteDialog.deleteButton}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating add button (mobile) */}
      <motion.button
        onClick={openNew}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl md:hidden z-40"
        style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Add new grimoire entry"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Favorites shortcut (mobile) */}
      {entries.some((e) => e.isFavorite) && !showFavorites && (
        <motion.button
          onClick={() => setShowFavorites(true)}
          className="fixed bottom-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg md:hidden z-40 text-sm"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--primary) / 0.4)',
            color: 'hsl(var(--primary))',
            fontFamily: 'var(--font-sans)',
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Star className="w-4 h-4" fill="currentColor" />
          {favCount} favorites
        </motion.button>
      )}

      {/* 5-step welcome flow for first-time authenticated visitors */}
      <AnimatePresence>
        {showWelcome && (
          <GrimoireWelcomeFlow onComplete={dismissWelcome} />
        )}
      </AnimatePresence>
    </>
  );
}
