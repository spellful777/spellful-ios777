import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, MessageSquare, HelpCircle, Plus, Trash2,
  Eye, PenLine, ChevronDown, Sparkles, BarChart2,
} from 'lucide-react';
import { useSession } from '@/lib/auth/auth-client';
import { useCommunityCategories } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { community_new } from 'virtual:content';

// ── Types ─────────────────────────────────────────────────────────────────────

type PostType = 'discussion' | 'question';

interface PollDraft {
  question: string;
  choices: string[];
  closesAt: string;
}

// ── Tag input ─────────────────────────────────────────────────────────────────

function TagInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [input, setInput] = useState('');
  const tags = value ? value.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    onChange([...tags, tag].join(', '));
    setInput('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag).join(', '));
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 min-h-[42px] w-full rounded-lg border border-input bg-muted px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 text-xs bg-card border border-border rounded-full px-2 py-0.5 text-foreground/80">
          #{tag}
          <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-destructive transition-colors leading-none">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? 'e.g. beginner, full moon, protection (comma-separated)' : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />
    </div>
  );
}

// ── Poll builder ──────────────────────────────────────────────────────────────

function PollBuilder({ poll, onChange }: { poll: PollDraft; onChange: (p: PollDraft) => void }) {
  const addChoice = () => {
    if (poll.choices.length >= 6) return;
    onChange({ ...poll, choices: [...poll.choices, ''] });
  };

  const removeChoice = (i: number) => {
    onChange({ ...poll, choices: poll.choices.filter((_, idx) => idx !== i) });
  };

  const updateChoice = (i: number, v: string) => {
    onChange({ ...poll, choices: poll.choices.map((c, idx) => idx === i ? v : c) });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' as const }}
      className="overflow-hidden"
    >
      <div className="rounded-xl border border-border bg-[hsl(var(--card-deep))] p-4 space-y-4 mt-2">
        {/* Question */}
        <div>
          <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
            {community_new.pollSection.questionLabel}
          </label>
          <Input
            value={poll.question}
            onChange={(e) => onChange({ ...poll, question: e.target.value })}
            placeholder="What would you like to ask?"
            maxLength={300}
            className="bg-muted border-border text-sm"
          />
        </div>

        {/* Choices */}
        <div>
          <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
            {community_new.pollSection.choicesLabel}
          </label>
          <div className="space-y-2">
            {poll.choices.map((choice, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={choice}
                  onChange={(e) => updateChoice(i, e.target.value)}
                  placeholder={`Choice ${i + 1}`}
                  maxLength={200}
                  className="bg-muted border-border text-sm flex-1"
                />
                {poll.choices.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeChoice(i)}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={community_new.pollSection.removeChoiceLabel}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {poll.choices.length < 6 && (
            <button
              type="button"
              onClick={addChoice}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> {community_new.pollSection.addChoiceLabel}
            </button>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">{community_new.pollSection.minChoicesHint}</p>
        </div>

        {/* Close date */}
        <div>
          <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
            {community_new.pollSection.closeDateLabel}
          </label>
          <Input
            type="datetime-local"
            value={poll.closesAt}
            onChange={(e) => onChange({ ...poll, closesAt: e.target.value })}
            className="bg-muted border-border text-sm w-auto"
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Preview ───────────────────────────────────────────────────────────────────

function PostPreview({
  type,
  categoryName,
  title,
  body,
  tags,
  poll,
}: {
  type: PostType;
  categoryName: string;
  title: string;
  body: string;
  tags: string;
  poll: PollDraft | null;
}) {
  const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' as const }}
      className="rounded-xl border border-border bg-card p-5 space-y-4"
    >
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {type === 'question' && (
          <span className="inline-flex items-center gap-1 text-xs border border-accent/40 text-accent rounded-full px-2 py-0.5">
            <HelpCircle className="w-3 h-3" /> Question
          </span>
        )}
        {categoryName && (
          <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">{categoryName}</span>
        )}
      </div>

      {/* Title */}
      <h2 className="font-heading text-xl text-foreground leading-snug">
        {title || <span className="text-muted-foreground italic">Your title will appear here…</span>}
      </h2>

      {/* Body */}
      <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
        {body || <span className="text-muted-foreground italic">Your post body will appear here…</span>}
      </div>

      {/* Poll preview */}
      {poll && (poll.question || poll.choices.some((c) => c.trim())) && (
        <div className="rounded-lg border border-border bg-[hsl(var(--card-deep))] p-3 space-y-2">
          <p className="text-sm font-semibold text-foreground">{poll.question || 'Poll question…'}</p>
          {poll.choices.map((c, i) => (
            <div key={i} className="rounded border border-border px-3 py-2 text-sm text-foreground/70">
              {c || `Choice ${i + 1}…`}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {tagList.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tagList.map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">#{tag}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NewPostPage() {
  const { session, isPending } = useSession();
  const navigate = useNavigate();
  const { categories, loading: catsLoading } = useCommunityCategories();

  // Form state
  const [postType, setPostType] = useState<PostType>('discussion');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audience, setAudience] = useState<'public' | 'coven'>('public');
  const [showPoll, setShowPoll] = useState(false);
  const [poll, setPoll] = useState<PollDraft>({ question: '', choices: ['', ''], closesAt: '' });
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  if (!isPending && !session) {
    navigate('/login?redirect=/community/new');
    return null;
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const validate = (): string => {
    if (!categoryId) return community_new.errors.categoryRequired;
    if (!title.trim()) return community_new.errors.titleRequired;
    if (title.trim().length < 5) return community_new.errors.titleTooShort;
    if (!body.trim()) return community_new.errors.bodyRequired;
    if (body.trim().length < 20) return community_new.errors.bodyTooShort;
    if (showPoll) {
      if (!poll.question.trim()) return community_new.errors.pollQuestion;
      const validChoices = poll.choices.filter((c) => c.trim());
      if (validChoices.length < 2) return community_new.errors.pollChoices;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      categoryId: Number(categoryId),
      type: postType,
      title: title.trim(),
      body: body.trim(),
      tags,
      audience,
      imageUrl: imageUrl.trim() || undefined,
    };

    if (showPoll) {
      payload.poll = {
        question: poll.question.trim(),
        choices: poll.choices.filter((c) => c.trim()),
        closesAt: poll.closesAt || undefined,
      };
    }

    const res = await fetch('/api/community/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.ok) {
      const data = await res.json() as { id: number };
      navigate(`/community/post/${data.id}`);
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? community_new.errors.generic);
    }
  };

  return (
    <>
      <Helmet>
        <title>{community_new.pageTitle} — Spellful Community</title>
        <meta name="description" content={community_new.pageSubtitle} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen">
        {/* Header */}
        <div className="border-b border-border bg-[hsl(var(--card-deep))]">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <Link
              to="/community"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {community_new.backLabel}
            </Link>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground">{community_new.pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-1">{community_new.pageSubtitle}</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Preview toggle */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-1.5"
            >
              {showPreview ? (
                <><PenLine className="w-3.5 h-3.5" /> {community_new.previewSection.editLabel}</>
              ) : (
                <><Eye className="w-3.5 h-3.5" /> {community_new.previewSection.toggleLabel}</>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showPreview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <PostPreview
                  type={postType}
                  categoryName={selectedCategory?.name ?? ''}
                  title={title}
                  body={body}
                  tags={tags}
                  poll={showPoll ? poll : null}
                />
              </motion.div>
            ) : (
              <motion.form
                key="form"
                ref={formRef}
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* ── Post type ── */}
                <fieldset>
                  <legend className="text-xs font-semibold text-foreground/70 mb-2">{community_new.typeSection.label}</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'discussion' as PostType, icon: MessageSquare, label: community_new.typeSection.discussion, desc: community_new.typeSection.discussionDesc },
                      { value: 'question' as PostType, icon: HelpCircle, label: community_new.typeSection.question, desc: community_new.typeSection.questionDesc },
                    ] as const).map(({ value, icon: Icon, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPostType(value)}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                          postType === value
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/40'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${postType === value ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className={`text-sm font-semibold ${postType === value ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* ── Category ── */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                    {community_new.categoryLabel} <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full appearance-none rounded-lg border border-input bg-muted px-3 py-2.5 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={catsLoading}
                    >
                      <option value="">{community_new.categoryPlaceholder}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* ── Title ── */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                    {community_new.titleLabel} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your post a clear, descriptive title…"
                    maxLength={300}
                    className="bg-muted border-border text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">{title.length}/300</p>
                </div>

                {/* ── Body ── */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                    {community_new.bodyLabel} <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Share your thoughts, question, or story…"
                    rows={8}
                    className="bg-muted border-border text-sm resize-y"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">{body.length} chars</p>
                </div>

                {/* ── Tags ── */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                    {community_new.tagsLabel}
                  </label>
                  <TagInput value={tags} onChange={setTags} />
                  <p className="text-[10px] text-muted-foreground mt-1">{community_new.tagsHint}</p>
                </div>

                {/* ── Audience ── */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                    Audience
                  </label>
                  <div className="flex gap-2">
                    {([
                      { value: 'public' as const, label: '🌍 Public', desc: 'Visible to all members' },
                      { value: 'coven' as const, label: '🔮 My Coven', desc: 'Only your Coven members' },
                    ]).map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAudience(value)}
                        className="flex-1 p-3 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary"
                        style={audience === value
                          ? { background: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary))' }
                          : { borderColor: 'hsl(var(--border))' }}
                        aria-pressed={audience === value}
                      >
                        <p className="text-sm font-medium" style={{ color: audience === value ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Image URL ── */}
                <div>
                  <label className="block text-xs font-semibold text-foreground/70 mb-1.5">
                    {community_new.imageSection.label}
                  </label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://…"
                    type="url"
                    className="bg-muted border-border text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">{community_new.imageSection.hint}</p>
                </div>

                {/* ── Poll toggle ── */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPoll((v) => !v)}
                    className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors ${
                      showPoll
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                    }`}
                  >
                    <BarChart2 className="w-4 h-4" />
                    {community_new.pollSection.toggleLabel}
                  </button>

                  <AnimatePresence>
                    {showPoll && (
                      <PollBuilder poll={poll} onChange={setPoll} />
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Error ── */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Submit ── */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Sparkles className="w-4 h-4" />
                    {submitting ? community_new.submittingLabel : community_new.submitLabel}
                  </Button>
                  <Link to="/community">
                    <Button type="button" variant="ghost" className="text-muted-foreground">
                      {community_new.cancelLabel}
                    </Button>
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
