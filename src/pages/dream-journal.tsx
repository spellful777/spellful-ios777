import { dream_journal } from 'virtual:content';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { useSession } from '@/lib/auth/auth-client';
import { getMoonPhase } from '@/lib/moon-phase-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  CloudMoon,
  Plus,
  Search,
  Trash2,
  Edit3,
  BookOpen,
  Sparkles,
  Leaf,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LockKeyhole,
  LockKeyholeOpen,
  ShieldCheck,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { DreamVaultProvider, useDreamVault } from '@/lib/dream-vault-context';
import {
  encryptDreamEntry,
  decryptDreamEntry,
  isEncrypted,
  isPlaintext,
  type DreamEncryptedPayload,
} from '@/lib/dream-crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DreamEntry {
  id: number;
  type: string;
  title: string;
  content: string;
  tags: string;
  moonPhase: string;
  entryDate: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

interface DecryptedDream extends DreamEntry {
  decryptedTitle: string;
  decryptedContent: string;
  decryptedTags: string;
  decryptedDreamType: string;
  decryptedMood: string;
  encrypted: boolean;
}

// ─── Dream type + mood options ────────────────────────────────────────────────

const DREAM_TYPES = [
  { value: 'ordinary', label: 'Ordinary', emoji: '🌙' },
  { value: 'lucid', label: 'Lucid', emoji: '✨' },
  { value: 'nightmare', label: 'Nightmare', emoji: '🌑' },
  { value: 'recurring', label: 'Recurring', emoji: '🔄' },
  { value: 'prophetic', label: 'Prophetic', emoji: '🔮' },
  { value: 'visitation', label: 'Visitation', emoji: '👁️' },
  { value: 'hypnagogic', label: 'Hypnagogic', emoji: '🌀' },
];

const MOODS = [
  { value: 'peaceful', label: 'Peaceful', emoji: '🕊️' },
  { value: 'joyful', label: 'Joyful', emoji: '☀️' },
  { value: 'curious', label: 'Curious', emoji: '🔍' },
  { value: 'awe', label: 'Awe', emoji: '🌌' },
  { value: 'anxious', label: 'Anxious', emoji: '🌊' },
  { value: 'fearful', label: 'Fearful', emoji: '🌑' },
  { value: 'confused', label: 'Confused', emoji: '🌫️' },
  { value: 'sad', label: 'Sad', emoji: '🌧️' },
  { value: 'neutral', label: 'Neutral', emoji: '⚖️' },
];

// ─── Dream Symbol Library ─────────────────────────────────────────────────────

interface DreamSymbol {
  symbol: string;
  emoji: string;
  themes: string[];
  interpretation: string;
  culturalNotes: string;
  questions: string[];
}

const DREAM_SYMBOLS: DreamSymbol[] = [
  {
    symbol: 'Water',
    emoji: '💧',
    themes: ['emotions', 'unconscious', 'change', 'purification'],
    interpretation: 'Water often reflects the emotional landscape of the dreamer. Calm water may suggest inner peace or clarity; turbulent water can point to emotional overwhelm or unresolved feelings.',
    culturalNotes: 'In Jungian psychology, water represents the unconscious mind. Many traditions associate water with the feminine, the moon, and cycles of renewal.',
    questions: ['What was the quality of the water — calm, stormy, murky, clear?', 'Were you in the water or observing it?', 'What emotions arose in the dream?'],
  },
  {
    symbol: 'Flying',
    emoji: '🕊️',
    themes: ['freedom', 'perspective', 'ambition', 'escape'],
    interpretation: 'Flying dreams often arise during periods of confidence, creative expansion, or a desire for freedom. Difficulty flying may reflect obstacles or self-doubt in waking life.',
    culturalNotes: 'Across many cultures, flight symbolizes spiritual ascent, liberation from earthly concerns, or the soul\'s journey. In lucid dreaming traditions, flying is a common first conscious act.',
    questions: ['Were you flying freely or struggling?', 'What were you flying toward or away from?', 'How did it feel — exhilarating, frightening, peaceful?'],
  },
  {
    symbol: 'House',
    emoji: '🏠',
    themes: ['self', 'psyche', 'identity', 'family'],
    interpretation: 'A house in dreams often represents the self or psyche. Different rooms may correspond to different aspects of your inner life. An unfamiliar house may suggest unexplored parts of yourself.',
    culturalNotes: 'Carl Jung described the house as a symbol of the psyche, with the basement representing the unconscious and upper floors the higher mind or aspirations.',
    questions: ['Was it your home or a stranger\'s?', 'What condition was the house in?', 'Were there rooms you couldn\'t enter or hadn\'t seen before?'],
  },
  {
    symbol: 'Shadow Figure',
    emoji: '🌑',
    themes: ['shadow self', 'unconscious', 'fear', 'integration'],
    interpretation: 'A dark or shadowy figure often represents the Jungian "shadow" — aspects of yourself that have been suppressed or not yet acknowledged. Meeting this figure with curiosity rather than fear can be transformative.',
    culturalNotes: 'In Jungian psychology, the shadow contains both feared and unlived potential. Many spiritual traditions speak of confronting one\'s darkness as a path to wholeness.',
    questions: ['Did the figure feel threatening or neutral?', 'Did it resemble anyone you know?', 'What happened when you faced it?'],
  },
  {
    symbol: 'Teeth Falling Out',
    emoji: '🦷',
    themes: ['anxiety', 'communication', 'appearance', 'loss'],
    interpretation: 'One of the most common dream symbols. Often associated with anxiety about appearance, communication, or fear of loss. May arise during periods of stress or major life transitions.',
    culturalNotes: 'In some folk traditions, teeth dreams were seen as omens. Modern dream research links them most commonly to stress and anxiety rather than prophetic meaning.',
    questions: ['What emotion accompanied the dream?', 'Are you anxious about how others perceive you?', 'What in your life feels unstable or at risk?'],
  },
  {
    symbol: 'Snake',
    emoji: '🐍',
    themes: ['transformation', 'healing', 'wisdom', 'fear', 'sexuality'],
    interpretation: 'Snakes carry rich symbolic meaning across cultures. They can represent transformation (shedding skin), hidden wisdom, primal energy, or fears that need to be faced.',
    culturalNotes: 'In Greek mythology, snakes were associated with Asclepius and healing. In many Indigenous traditions, the serpent is a symbol of earth wisdom and renewal. In Kundalini yoga, the serpent represents awakening energy.',
    questions: ['Was the snake threatening or peaceful?', 'What did you feel — fear, fascination, reverence?', 'What transformation might be underway in your life?'],
  },
  {
    symbol: 'Being Chased',
    emoji: '🏃',
    themes: ['avoidance', 'anxiety', 'unresolved conflict', 'pressure'],
    interpretation: 'Chase dreams often reflect something in waking life you are avoiding — a difficult conversation, a decision, or an emotion. The pursuer may represent an aspect of yourself or a situation demanding attention.',
    culturalNotes: 'Across cultures, chase dreams are among the most universal. They are often interpreted as the psyche\'s way of drawing attention to something that needs to be faced rather than fled.',
    questions: ['What or who was chasing you?', 'Did you escape, or did you turn to face it?', 'What in your waking life might you be avoiding?'],
  },
  {
    symbol: 'Death',
    emoji: '💀',
    themes: ['transformation', 'endings', 'rebirth', 'change'],
    interpretation: 'Death in dreams rarely predicts literal death. It more often symbolizes the end of a phase, the death of an old identity, or a significant transformation. It can be a powerful symbol of renewal.',
    culturalNotes: 'In tarot, the Death card represents transformation and new beginnings. Many spiritual traditions view death as a threshold, not an ending.',
    questions: ['Who or what died in the dream?', 'What phase of your life might be ending?', 'What new beginning might this make space for?'],
  },
  {
    symbol: 'Forest',
    emoji: '🌲',
    themes: ['unconscious', 'mystery', 'nature', 'getting lost', 'discovery'],
    interpretation: 'A forest often represents the unconscious mind — vast, mysterious, and full of both danger and treasure. Getting lost in a forest may reflect feeling overwhelmed; finding a path suggests emerging clarity.',
    culturalNotes: 'In fairy tales and mythology, the forest is a liminal space where transformation occurs. It is the realm of the wild self, beyond the boundaries of the known.',
    questions: ['Were you lost or purposefully exploring?', 'Was the forest dark and threatening or beautiful and alive?', 'What did you find or encounter there?'],
  },
  {
    symbol: 'Baby or Child',
    emoji: '👶',
    themes: ['new beginnings', 'innocence', 'potential', 'vulnerability', 'inner child'],
    interpretation: 'A baby or child in dreams often represents new beginnings, untapped potential, or the inner child. A neglected child may point to parts of yourself that need nurturing.',
    culturalNotes: 'In Jungian psychology, the child archetype represents the potential for wholeness and the promise of new growth. Many traditions associate children with purity and divine connection.',
    questions: ['Was the child healthy and cared for, or in need?', 'Did the child feel like you, or someone else?', 'What new project, relationship, or aspect of yourself might this represent?'],
  },
  {
    symbol: 'Moon',
    emoji: '🌙',
    themes: ['intuition', 'cycles', 'the feminine', 'mystery', 'the unconscious'],
    interpretation: 'The moon in dreams often speaks to intuition, emotional cycles, and the hidden or mysterious aspects of life. A full moon may suggest heightened awareness; a new moon, new beginnings.',
    culturalNotes: 'Across virtually every culture, the moon is associated with the feminine, cycles, and the unconscious. In astrology, the moon governs emotions, instincts, and the inner self.',
    questions: ['What phase was the moon in?', 'How did it make you feel — awed, comforted, unsettled?', 'What cycle in your life might be reaching a peak or beginning anew?'],
  },
  {
    symbol: 'Fire',
    emoji: '🔥',
    themes: ['passion', 'transformation', 'destruction', 'purification', 'energy'],
    interpretation: 'Fire is a powerful symbol of transformation. It can represent passion, creative energy, anger, or the burning away of what no longer serves. The context matters greatly.',
    culturalNotes: 'Fire is sacred in many traditions — from Zoroastrian fire temples to the Olympic flame. It represents both destruction and renewal, the forge that transforms raw material.',
    questions: ['Were you controlling the fire, or was it out of control?', 'What was burning?', 'Did the fire feel destructive, purifying, or energizing?'],
  },
];

// ─── Shadow Work Prompts ──────────────────────────────────────────────────────

interface ShadowPrompt {
  category: string;
  emoji: string;
  prompts: string[];
  connection?: string;
}

const SHADOW_PROMPTS: ShadowPrompt[] = [
  {
    category: 'Confidence & Self-Worth',
    emoji: '✨',
    prompts: [
      'What do you most fear others will discover about you? What would it mean if they did?',
      'When do you feel most like a fraud? What belief underlies that feeling?',
      'What compliment is hardest for you to receive? Why might that be?',
      'What would you do if you knew you couldn\'t fail? What stops you from trying anyway?',
      'Whose approval do you seek most? What would it mean to stop needing it?',
    ],
  },
  {
    category: 'Boundaries & Relationships',
    emoji: '🌊',
    prompts: [
      'Where in your life do you say yes when you mean no? What are you afraid will happen if you say no?',
      'Who in your life drains your energy? What keeps you in that dynamic?',
      'What do you need from others that you find difficult to ask for?',
      'When do you feel most invisible? What do you wish people understood about you?',
      'What relationship pattern keeps repeating in your life? What might it be teaching you?',
    ],
  },
  {
    category: 'Emotions & Inner Life',
    emoji: '💜',
    prompts: [
      'What emotion do you find hardest to feel or express? When did you learn to suppress it?',
      'What are you grieving that you haven\'t fully acknowledged?',
      'What makes you feel most alive? How much space does it have in your life?',
      'What do you envy in others? What does that envy reveal about your own desires?',
      'What would you say to your younger self about what was coming?',
    ],
  },
  {
    category: 'Purpose & Direction',
    emoji: '🌟',
    prompts: [
      'What dream have you abandoned that still calls to you?',
      'What would you regret not having tried at the end of your life?',
      'Where are you living someone else\'s definition of success?',
      'What would you do with your time if no one was watching or judging?',
      'What is the difference between the life you are living and the life you want?',
    ],
  },
  {
    category: 'Body & Instinct',
    emoji: '🌿',
    prompts: [
      'Where in your body do you hold tension or pain? What might it be carrying?',
      'When did you last feel fully at home in your body?',
      'What physical sensations do you tend to ignore or push through?',
      'What does your body need that you have been denying it?',
      'What would it mean to trust your instincts more fully?',
    ],
    connection: 'herbs',
  },
];

// ─── Moon phase helper ────────────────────────────────────────────────────────
// Delegates to moon-phase-engine.ts (Meeus Ch. 47) — single source of truth.

function getMoonPhaseForDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z');
  return getMoonPhase(date).phase;
}

// ─── Privacy disclosure drawer ────────────────────────────────────────────────

function PrivacyDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: 'hsl(var(--accent))' }} />
            How we protect your dreams
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed mt-2">
          <div>
            <p className="font-semibold text-foreground mb-1">What is encrypted</p>
            <p>Your dream titles, descriptions, symbols, feelings, dream type, and mood are encrypted in your browser using AES-256-GCM before being sent to our servers. Only ciphertext is stored — we cannot read your dreams.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Your journal passphrase</p>
            <p>Encryption uses a key derived from your journal passphrase (separate from your account password). Your passphrase never leaves your device. If you lose it, your encrypted entries cannot be recovered — there is no administrator backdoor.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">What is not encrypted</p>
            <p>Entry dates, moon phases, and your account metadata (entry count, timestamps) are stored as plaintext. These are needed for the journal to function.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Residual risks</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>A compromised device or browser can expose plaintext before encryption</li>
              <li>Malicious browser extensions may intercept your passphrase</li>
              <li>Server backups taken before you migrated existing entries may still contain plaintext</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">No AI analysis</p>
            <p>Your dream content is never sent to AI services, third-party analytics, or advertising systems. There is no AI interpretation of your dreams.</p>
          </div>
          <div className="rounded-lg bg-muted p-3 text-xs">
            <p className="text-muted-foreground">This journal uses the Web Crypto API (PBKDF2 + AES-256-GCM). We do not claim it is unhackable or 100% secure — no system is. We have designed it to make your dreams meaningless to anyone who accesses the database without your passphrase.</p>
          </div>
        </div>
        <Button onClick={onClose} className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Vault setup dialog (new users) ──────────────────────────────────────────

function VaultSetupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createVault } = useDreamVault();
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (passphrase.length < 8) { setError('Passphrase must be at least 8 characters.'); return; }
    if (passphrase !== confirm) { setError('Passphrases do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await createVault(passphrase);
      setPassphrase(''); setConfirm('');
      onClose();
    } catch {
      setError('Could not create vault. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground flex items-center gap-2">
            <LockKeyhole size={18} style={{ color: 'hsl(var(--primary))' }} />
            Create your journal vault
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            Set a journal passphrase to encrypt your dreams. This is separate from your account password. <strong className="text-foreground">If you lose this passphrase, your encrypted entries cannot be recovered.</strong>
          </p>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Journal passphrase</Label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="At least 8 characters"
                className="bg-muted border-border text-foreground pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPass ? 'Hide passphrase' : 'Show passphrase'}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Confirm passphrase</Label>
            <Input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat passphrase"
              className="bg-muted border-border text-foreground"
              autoComplete="new-password"
              onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
            />
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <AlertTriangle size={12} className="inline mr-1 text-warning" />
            Write this passphrase down and store it safely. There is no recovery option.
          </div>
          <Button
            onClick={() => void handleCreate()}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? 'Creating vault…' : 'Create vault & encrypt my dreams'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Vault unlock dialog ──────────────────────────────────────────────────────

function VaultUnlockDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { unlock } = useDreamVault();
  const [passphrase, setPassphrase] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUnlock() {
    if (!passphrase) { setError('Enter your journal passphrase.'); return; }
    setLoading(true);
    setError('');
    try {
      await unlock(passphrase);
      setPassphrase('');
      onClose();
    } catch {
      setError('Incorrect passphrase. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground flex items-center gap-2">
            <LockKeyhole size={18} style={{ color: 'hsl(var(--primary))' }} />
            Unlock your dream journal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 text-sm">
          <p className="text-muted-foreground">Enter your journal passphrase to decrypt your dreams.</p>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Journal passphrase</Label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Your journal passphrase"
                className="bg-muted border-border text-foreground pr-10"
                autoComplete="current-password"
                onKeyDown={(e) => { if (e.key === 'Enter') void handleUnlock(); }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPass ? 'Hide passphrase' : 'Show passphrase'}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <Button
            onClick={() => void handleUnlock()}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? 'Unlocking…' : 'Unlock journal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Migration dialog ─────────────────────────────────────────────────────────

interface MigrationDialogProps {
  open: boolean;
  onClose: () => void;
  plaintextEntries: DreamEntry[];
  onComplete: () => void;
}

function MigrationDialog({ open, onClose, plaintextEntries, onComplete }: MigrationDialogProps) {
  const { vaultKey } = useDreamVault();
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleMigrate() {
    if (!vaultKey) return;
    setRunning(true);
    setError('');
    try {
      for (let i = 0; i < plaintextEntries.length; i++) {
        const entry = plaintextEntries[i]!;
        const { metadata, title: sentinelTitle, content: sentinelContent, tags: sentinelTags } =
          await encryptDreamEntry(
            entry.title,
            entry.content,
            entry.tags ?? '',
            '',
            '',
            vaultKey,
          );
        await fetch(`/api/grimoire/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: sentinelTitle,
            content: sentinelContent,
            tags: sentinelTags,
            metadata,
          }),
        });
        setProgress(i + 1);
      }
      setDone(true);
      onComplete();
    } catch {
      setError('Migration failed partway through. Please try again — already-migrated entries will be skipped.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !running) onClose(); }}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-foreground flex items-center gap-2">
            <RefreshCw size={18} style={{ color: 'hsl(var(--primary))' }} />
            Encrypt existing dreams
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 text-sm">
          {!done ? (
            <>
              <p className="text-muted-foreground leading-relaxed">
                You have <strong className="text-foreground">{plaintextEntries.length} dream{plaintextEntries.length !== 1 ? 's' : ''}</strong> stored as plaintext. Encrypt them now so only you can read them.
              </p>
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
                <p><AlertTriangle size={12} className="inline mr-1 text-warning" />Server backups taken before this migration may still contain plaintext. Contact support if you need old backups purged.</p>
                <p>This cannot be undone. Make sure you have saved your journal passphrase.</p>
              </div>
              {running && (
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(progress / plaintextEntries.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{progress} / {plaintextEntries.length} encrypted</p>
                </div>
              )}
              {error && <p className="text-destructive text-xs">{error}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={() => void handleMigrate()}
                  disabled={running}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {running ? 'Encrypting…' : 'Encrypt all dreams'}
                </Button>
                {!running && (
                  <Button variant="outline" onClick={onClose} className="border-border">
                    Later
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-foreground font-semibold">All dreams encrypted ✦</p>
              <p className="text-muted-foreground text-sm">Your {plaintextEntries.length} dream{plaintextEntries.length !== 1 ? 's are' : ' is'} now encrypted on your device. Only you can read them.</p>
              <Button onClick={onClose} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Done</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Dream Card ───────────────────────────────────────────────────────────────

interface DreamCardProps {
  entry: DecryptedDream;
  onEdit: (e: DecryptedDream) => void;
  onDelete: (id: number) => void;
}

function DreamCard({ entry, onEdit, onDelete }: DreamCardProps) {
  const [expanded, setExpanded] = useState(false);
  const tags = entry.decryptedTags
    ? entry.decryptedTags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  const formattedDate = entry.entryDate
    ? new Date(entry.entryDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const dreamTypeInfo = DREAM_TYPES.find((d) => d.value === entry.decryptedDreamType);
  const moodInfo = MOODS.find((m) => m.value === entry.decryptedMood);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <CloudMoon size={14} style={{ color: 'hsl(var(--grimoire-dream))' }} />
              {entry.moonPhase && (
                <span className="text-xs text-muted-foreground">{entry.moonPhase}</span>
              )}
              {dreamTypeInfo && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {dreamTypeInfo.emoji} {dreamTypeInfo.label}
                </span>
              )}
              {moodInfo && (
                <span className="text-xs text-muted-foreground">{moodInfo.emoji}</span>
              )}
              {entry.encrypted && (
                <LockKeyhole size={11} style={{ color: 'hsl(var(--accent))' }} aria-label="Encrypted" />
              )}
            </div>
            <h3 className="font-semibold text-foreground">{entry.decryptedTitle}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{formattedDate}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Edit dream"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
              aria-label="Delete dream"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className={`mt-2 text-sm text-card-foreground leading-relaxed ${!expanded ? 'line-clamp-3' : 'whitespace-pre-wrap'}`}>
          {entry.decryptedContent}
        </div>

        {entry.decryptedContent.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
          </button>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'hsl(var(--grimoire-dream) / 0.15)', color: 'hsl(var(--grimoire-dream))' }}
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

// ─── Dream Form ───────────────────────────────────────────────────────────────

interface DreamFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editing: DecryptedDream | null;
}

function DreamForm({ open, onClose, onSave, editing }: DreamFormProps) {
  const { vaultKey } = useDreamVault();
  const today = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [symbols, setSymbols] = useState('');
  const [feelings, setFeelings] = useState('');
  const [dreamType, setDreamType] = useState('ordinary');
  const [mood, setMood] = useState('neutral');
  const [entryDate, setEntryDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) {
      setTitle(editing.decryptedTitle);
      setContent(editing.decryptedContent);
      const allTags = editing.decryptedTags ? editing.decryptedTags.split(',').map((t) => t.trim()) : [];
      // Heuristic: symbols tend to be single words, feelings tend to be adjectives
      setSymbols(allTags.slice(0, Math.ceil(allTags.length / 2)).join(', '));
      setFeelings(allTags.slice(Math.ceil(allTags.length / 2)).join(', '));
      setDreamType(editing.decryptedDreamType || 'ordinary');
      setMood(editing.decryptedMood || 'neutral');
      setEntryDate(editing.entryDate);
    } else {
      setTitle(''); setContent(''); setSymbols(''); setFeelings('');
      setDreamType('ordinary'); setMood('neutral'); setEntryDate(today);
    }
    setError('');
  }, [editing, open, today]);

  const moonPhase = entryDate ? getMoonPhaseForDate(entryDate) : '';

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      setError('Title and dream description are required.');
      return;
    }
    if (!vaultKey) {
      setError('Journal is locked. Please unlock it first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const combinedTags = [
        ...symbols.split(',').map((s) => s.trim()).filter(Boolean),
        ...feelings.split(',').map((f) => f.trim()).filter(Boolean),
      ].join(', ');

      const { metadata, title: sentinelTitle, content: sentinelContent, tags: sentinelTags } =
        await encryptDreamEntry(title.trim(), content.trim(), combinedTags, dreamType, mood, vaultKey);

      const url = editing ? `/api/grimoire/${editing.id}` : '/api/grimoire';
      const method = editing ? 'PUT' : 'POST';
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'dream',
          title: sentinelTitle,
          content: sentinelContent,
          tags: sentinelTags,
          moonPhase,
          entryDate,
          metadata,
        }),
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
          <DialogTitle className="font-serif text-xl text-foreground flex items-center gap-2">
            {editing ? dream_journal.form.editTitle : dream_journal.form.addTitle}
            <LockKeyhole size={14} style={{ color: 'hsl(var(--accent))' }} aria-label="Encrypted" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">Dream Date</Label>
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            {moonPhase && (
              <div className="flex items-end pb-2">
                <p className="text-xs text-muted-foreground">
                  🌙 <span style={{ color: 'hsl(var(--accent))' }}>{moonPhase}</span>
                </p>
              </div>
            )}
          </div>

          {/* Dream type */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Dream type</Label>
            <div className="flex flex-wrap gap-1.5">
              {DREAM_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => setDreamType(dt.value)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                    dreamType === dt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {dt.emoji} {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Waking mood</Label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                    mood === m.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Dream title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this dream a name..."
              className="bg-muted border-border text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Dream description</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe what you remember — images, feelings, people, places..."
              rows={6}
              className="bg-muted border-border text-foreground resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Symbols (comma-separated)</Label>
            <Input
              value={symbols}
              onChange={(e) => setSymbols(e.target.value)}
              placeholder="water, flying, house, shadow..."
              className="bg-muted border-border text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">Feelings (comma-separated)</Label>
            <Input
              value={feelings}
              onChange={(e) => setFeelings(e.target.value)}
              placeholder="peaceful, anxious, curious, joyful..."
              className="bg-muted border-border text-foreground"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LockKeyhole size={11} style={{ color: 'hsl(var(--accent))' }} />
            <span>Encrypted on your device before saving</span>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? 'Encrypting & saving…' : dream_journal.form.saveButton}
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

// ─── Symbol Card ──────────────────────────────────────────────────────────────

function SymbolCard({ symbol }: { symbol: DreamSymbol }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{symbol.emoji}</span>
          <div>
            <h3 className="font-semibold text-foreground">{symbol.symbol}</h3>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {symbol.themes.slice(0, 3).map((t, i) => (
                <span key={t} className="text-xs text-muted-foreground">
                  {i > 0 && <span className="mr-1">·</span>}{t}
                </span>
              ))}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <p className="text-sm text-card-foreground leading-relaxed">{symbol.interpretation}</p>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground font-semibold mb-1">Cultural context</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{symbol.culturalNotes}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2">Questions to explore</p>
                <ul className="space-y-1">
                  {symbol.questions.map((q, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5 shrink-0">✦</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shadow Work Tab ──────────────────────────────────────────────────────────

function ShadowWorkTab() {
  const [activeCategory, setActiveCategory] = useState(0);
  // eslint-disable-next-line security/detect-object-injection
  const category = SHADOW_PROMPTS[activeCategory];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{dream_journal.shadowWork.intro}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SHADOW_PROMPTS.map((cat, i) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(i)}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              activeCategory === i
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.emoji} {cat.category}
          </button>
        ))}
      </div>

      {category && (
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {category.prompts.map((prompt, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
            >
              <p className="text-sm text-foreground leading-relaxed">{prompt}</p>
              <div className="flex gap-2 mt-3">
                <Link to="/grimoire">
                  <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground gap-1.5 text-xs">
                    <BookOpen size={12} />
                    Write in Grimoire
                  </Button>
                </Link>
                <Link to="/tarot">
                  <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground gap-1.5 text-xs">
                    <Sparkles size={12} />
                    Pull a Tarot Card
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {category.connection === 'herbs' && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf size={14} className="text-green-400" />
                <p className="text-sm font-semibold text-foreground">Supportive herbs for this work</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Certain herbs have traditional associations with grounding, emotional clarity, and nervous system support. Always research safety before use.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Ashwagandha', 'Chamomile', 'Lavender', 'Valerian', 'Passionflower'].map((herb) => (
                  <Link key={herb} to="/herbs">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      🌿 {herb}
                      <ExternalLink size={10} />
                    </span>
                  </Link>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                ⚠️ Always consult a qualified herbalist or healthcare provider before using herbs medicinally, especially if pregnant, nursing, or on medication.
              </p>
            </div>
          )}
        </motion.div>
      )}

      <div className="rounded-xl border border-border bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">{dream_journal.shadowWork.disclaimer}</p>
      </div>
    </div>
  );
}

// ─── Inner page (needs vault context) ────────────────────────────────────────

function DreamJournalInner() {
  const { session, isPending } = useSession();
  const navigate = useNavigate();
  const { status, vaultKey, lock, resetIdle } = useDreamVault();

  const [dreams, setDreams] = useState<DecryptedDream[]>([]);
  const [rawDreams, setRawDreams] = useState<DreamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DecryptedDream | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [plaintextEntries, setPlaintextEntries] = useState<DreamEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isPending && !session) void navigate('/login');
  }, [session, isPending, navigate]);

  // Reset idle on user activity
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => resetIdle();
    el.addEventListener('pointermove', handler, { passive: true });
    el.addEventListener('keydown', handler, { passive: true });
    return () => {
      el.removeEventListener('pointermove', handler);
      el.removeEventListener('keydown', handler);
    };
  }, [resetIdle]);

  // Fetch raw entries
  const fetchRaw = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'dream' });
      const resp = await fetch(`/api/grimoire?${params.toString()}`);
      if (resp.ok) {
        const data = (await resp.json()) as DreamEntry[];
        setRawDreams(data);
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { void fetchRaw(); }, [fetchRaw]);

  // Decrypt entries when vault is unlocked
  useEffect(() => {
    if (!vaultKey || rawDreams.length === 0) {
      if (status !== 'unlocked') setDreams([]);
      return;
    }

    const plaintext = rawDreams.filter((e) => isPlaintext(e.metadata));
    if (plaintext.length > 0) {
      setPlaintextEntries(plaintext);
      setShowMigration(true);
    }

    void (async () => {
      const decrypted = await Promise.all(
        rawDreams.map(async (entry): Promise<DecryptedDream> => {
          if (isEncrypted(entry.metadata)) {
            const dec = await decryptDreamEntry(entry.metadata as DreamEncryptedPayload, vaultKey);
            return {
              ...entry,
              decryptedTitle: dec.title,
              decryptedContent: dec.content,
              decryptedTags: dec.tags,
              decryptedDreamType: dec.dreamType,
              decryptedMood: dec.mood,
              encrypted: true,
            };
          }
          // Plaintext entry — show as-is until migrated
          return {
            ...entry,
            decryptedTitle: entry.title,
            decryptedContent: entry.content,
            decryptedTags: entry.tags,
            decryptedDreamType: '',
            decryptedMood: '',
            encrypted: false,
          };
        })
      );
      setDreams(decrypted);
    })();
  }, [vaultKey, rawDreams, status]);

  // Client-side search filter
  const filteredDreams = search
    ? dreams.filter(
        (d) =>
          d.decryptedTitle.toLowerCase().includes(search.toLowerCase()) ||
          d.decryptedContent.toLowerCase().includes(search.toLowerCase()) ||
          d.decryptedTags.toLowerCase().includes(search.toLowerCase())
      )
    : dreams;

  const filteredSymbols = DREAM_SYMBOLS.filter(
    (s) =>
      !symbolSearch ||
      s.symbol.toLowerCase().includes(symbolSearch.toLowerCase()) ||
      s.themes.some((t) => t.toLowerCase().includes(symbolSearch.toLowerCase()))
  );

  // Export encrypted JSON
  function handleExport() {
    if (!dreams.length) return;
    const exportData = dreams.map((d) => ({
      id: d.id,
      date: d.entryDate,
      moonPhase: d.moonPhase,
      dreamType: d.decryptedDreamType,
      mood: d.decryptedMood,
      title: d.decryptedTitle,
      content: d.decryptedContent,
      tags: d.decryptedTags,
      encrypted: d.encrypted,
    }));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), dreams: exportData }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spellful-dreams-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
        <title>Dream Journal — Spellful</title>
        <meta name="description" content="Record your dreams, explore their symbols, and illuminate your inner world with the Spellful Dream Journal." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="max-w-3xl mx-auto px-4 py-12" ref={containerRef}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-3"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <CloudMoon style={{ color: 'hsl(var(--grimoire-dream))' }} size={28} />
            <h1 className="font-serif text-4xl md:text-5xl text-foreground">
              {dream_journal.hero.title}
            </h1>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {dream_journal.hero.subtitle}
          </p>
        </motion.div>

        {/* Privacy trust signal */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setShowPrivacy(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            aria-label="How we protect your dreams"
          >
            <LockKeyhole size={12} style={{ color: 'hsl(var(--accent))' }} />
            <span>Private journal — entries encrypted on your device</span>
            <span className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">↗</span>
          </button>
        </div>

        {/* Vault status bar */}
        {status !== 'loading' && (
          <div className="flex items-center justify-between gap-3 mb-6 px-4 py-2.5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 text-sm">
              {status === 'unlocked' ? (
                <>
                  <LockKeyholeOpen size={14} style={{ color: 'hsl(var(--accent))' }} />
                  <span className="text-muted-foreground">Journal unlocked</span>
                  <span className="text-xs text-muted-foreground/60">· auto-locks after 5 min idle</span>
                </>
              ) : status === 'locked' ? (
                <>
                  <LockKeyhole size={14} style={{ color: 'hsl(var(--primary))' }} />
                  <span className="text-muted-foreground">Journal locked</span>
                </>
              ) : (
                <>
                  <LockKeyhole size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">No vault set up</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {status === 'unlocked' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="border-border text-muted-foreground hover:text-foreground gap-1.5 text-xs h-7"
                    title="Export decrypted dreams as JSON"
                  >
                    <Download size={11} />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={lock}
                    className="border-border text-muted-foreground hover:text-foreground gap-1.5 text-xs h-7"
                  >
                    <LockKeyhole size={11} />
                    Lock
                  </Button>
                </>
              )}
              {status === 'locked' && (
                <Button
                  size="sm"
                  onClick={() => setShowUnlock(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs h-7"
                >
                  <LockKeyholeOpen size={11} />
                  Unlock
                </Button>
              )}
              {status === 'no_vault' && (
                <Button
                  size="sm"
                  onClick={() => setShowSetup(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-xs h-7"
                >
                  <ShieldCheck size={11} />
                  Set up encryption
                </Button>
              )}
            </div>
          </div>
        )}

        <Tabs defaultValue="journal">
          <TabsList className="w-full mb-6 bg-muted">
            <TabsTrigger value="journal" className="flex-1">{dream_journal.tabs.journal}</TabsTrigger>
            <TabsTrigger value="symbols" className="flex-1">{dream_journal.tabs.symbols}</TabsTrigger>
            <TabsTrigger value="shadow" className="flex-1">{dream_journal.tabs.shadowWork}</TabsTrigger>
          </TabsList>

          {/* ── Journal Tab ── */}
          <TabsContent value="journal">
            {/* Locked state */}
            {status === 'locked' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <LockKeyhole className="mx-auto mb-4" size={40} style={{ color: 'hsl(var(--accent))' }} />
                <h2 className="font-serif text-2xl text-foreground mb-2">Your dreams are locked</h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Enter your journal passphrase to decrypt and view your dreams.
                </p>
                <Button
                  onClick={() => setShowUnlock(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <LockKeyholeOpen size={15} />
                  Unlock journal
                </Button>
              </motion.div>
            )}

            {/* No vault state */}
            {status === 'no_vault' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <ShieldCheck className="mx-auto mb-4 text-muted-foreground" size={40} />
                <h2 className="font-serif text-2xl text-foreground mb-2">Protect your dreams</h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Set up a journal passphrase to encrypt your dreams. Only you will be able to read them.
                </p>
                <Button
                  onClick={() => setShowSetup(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <ShieldCheck size={15} />
                  Set up encryption
                </Button>
              </motion.div>
            )}

            {/* Unlocked state */}
            {status === 'unlocked' && (
              <>
                <div className="flex gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search dreams, symbols, feelings..."
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
                  <Button
                    onClick={() => { setEditing(null); setFormOpen(true); }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                  >
                    <Plus size={15} />
                    Record
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredDreams.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
                  >
                    <CloudMoon className="mx-auto mb-4 text-muted-foreground" size={40} />
                    <h2 className="font-serif text-2xl text-foreground mb-2">{dream_journal.empty.title}</h2>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      {search ? 'No dreams match your search.' : dream_journal.empty.subtitle}
                    </p>
                    {!search && (
                      <Button
                        onClick={() => { setEditing(null); setFormOpen(true); }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                      >
                        <Plus size={15} />
                        <span>{dream_journal.empty.cta}</span>
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredDreams.map((dream) => (
                        <DreamCard
                          key={dream.id}
                          entry={dream}
                          onEdit={(e) => { setEditing(e); setFormOpen(true); }}
                          onDelete={(id) => setDeleteId(id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Symbol Library Tab ── */}
          <TabsContent value="symbols">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {dream_journal.symbolLibrary.disclaimer}
              </p>
              <div className="relative mb-4">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={symbolSearch}
                  onChange={(e) => setSymbolSearch(e.target.value)}
                  placeholder="Search symbols or themes..."
                  className="pl-9 bg-muted border-border text-foreground"
                />
                {symbolSearch && (
                  <button
                    onClick={() => setSymbolSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {filteredSymbols.map((symbol) => (
                <SymbolCard key={symbol.symbol} symbol={symbol} />
              ))}
              {filteredSymbols.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No symbols match your search.</p>
              )}
            </div>
          </TabsContent>

          {/* ── Shadow Work Tab ── */}
          <TabsContent value="shadow">
            <ShadowWorkTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <VaultSetupDialog open={showSetup} onClose={() => setShowSetup(false)} />
      <VaultUnlockDialog open={showUnlock} onClose={() => setShowUnlock(false)} />
      <PrivacyDrawer open={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <MigrationDialog
        open={showMigration}
        onClose={() => setShowMigration(false)}
        plaintextEntries={plaintextEntries}
        onComplete={() => void fetchRaw()}
      />

      <DreamForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={() => void fetchRaw()}
        editing={editing}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-foreground">Delete this dream?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the entry. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId !== null) void (async () => {
                await fetch(`/api/grimoire/${deleteId}`, { method: 'DELETE' });
                setDeleteId(null);
                void fetchRaw();
              })(); }}
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

// ─── Main export (wraps with vault provider) ──────────────────────────────────

export default function DreamJournalPage() {
  return (
    <DreamVaultProvider>
      <DreamJournalInner />
    </DreamVaultProvider>
  );
}
