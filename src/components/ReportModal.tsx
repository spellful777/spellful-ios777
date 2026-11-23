/**
 * ReportModal — reason picker + optional details for reporting posts, replies, and profiles.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REASONS = [
  { key: 'harassment',     label: 'Harassment or bullying' },
  { key: 'hate_speech',    label: 'Hate speech or discrimination' },
  { key: 'spam',           label: 'Spam or self-promotion' },
  { key: 'misinformation', label: 'Misinformation or harmful content' },
  { key: 'inappropriate',  label: 'Inappropriate or explicit content' },
  { key: 'other',          label: 'Other' },
] as const;

type ReasonKey = typeof REASONS[number]['key'];

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: 'post' | 'reply' | 'profile';
  targetId: number | string;
}

export function ReportModal({ open, onClose, targetType, targetId }: ReportModalProps) {
  const [reason, setReason] = useState<ReasonKey | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<'idle' | 'success' | 'duplicate' | 'error'>('idle');

  function reset() {
    setReason(null);
    setDetails('');
    setSubmitting(false);
    setState('idle');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/community/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetType, targetId, reason, details: details.trim() || undefined }),
      });
      if (res.status === 409) { setState('duplicate'); return; }
      if (!res.ok) { setState('error'); return; }
      setState('success');
    } catch {
      setState('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'hsl(var(--background) / 0.85)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' as const }}
            className="w-full max-w-sm rounded-2xl border p-6 space-y-5"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  Report {targetType}
                </h2>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg transition-colors hover:bg-muted" aria-label="Close">
                <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              </button>
            </div>

            {state === 'success' ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-2xl">✅</p>
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Report submitted</p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Our moderators will review it. Thank you for helping keep Spellful safe.
                </p>
                <Button size="sm" variant="outline" onClick={handleClose} className="mt-2">Close</Button>
              </div>
            ) : state === 'duplicate' ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-2xl">🔔</p>
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>Already reported</p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  You've already submitted a report for this content. Moderators are reviewing it.
                </p>
                <Button size="sm" variant="outline" onClick={handleClose} className="mt-2">Close</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Why are you reporting this?
                  </p>
                  <div className="space-y-1.5">
                    {REASONS.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => setReason(r.key)}
                        className="w-full text-left px-3 py-2 rounded-xl text-sm border transition-all"
                        style={{
                          borderColor: reason === r.key ? 'hsl(var(--destructive))' : 'hsl(var(--border))',
                          background: reason === r.key ? 'hsl(var(--destructive) / 0.08)' : 'hsl(var(--muted))',
                          color: reason === r.key ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))',
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Additional details <span className="font-normal">(optional)</span>
                  </p>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="Describe what you saw…"
                    className="w-full text-sm rounded-xl px-3 py-2 resize-none border"
                    style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  />
                  <p className="text-xs text-right" style={{ color: 'hsl(var(--muted-foreground))' }}>{details.length}/500</p>
                </div>

                {state === 'error' && (
                  <p className="text-xs" style={{ color: 'hsl(var(--destructive))' }}>Something went wrong. Please try again.</p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">Cancel</Button>
                  <Button
                    size="sm"
                    disabled={!reason || submitting}
                    onClick={submit}
                    className="flex-1"
                    style={{
                      background: 'hsl(var(--destructive))',
                      color: 'hsl(var(--destructive-foreground))',
                      opacity: !reason || submitting ? 0.5 : 1,
                    }}
                  >
                    {submitting ? 'Submitting…' : 'Submit report'}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
