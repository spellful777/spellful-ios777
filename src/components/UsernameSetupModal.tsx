/**
 * UsernameSetupModal
 * Shown to authenticated users who don't yet have a valid username.
 * Blocks public participation until a compliant username is chosen.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateUsernameFormat, usernameErrorMessage } from '@/lib/username-rules';

interface Props {
  onComplete: (username: string) => void;
}

export function UsernameSetupModal({ onComplete }: Props) {
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  // Debounced availability check
  useEffect(() => {
    setAvailable(null);
    setError('');
    if (!value) return;
    const fmtErr = validateUsernameFormat(value);
    if (fmtErr) { setError(usernameErrorMessage(fmtErr)); return; }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const r = await fetch(`/api/username/check?username=${encodeURIComponent(value)}`, { credentials: 'include' });
        const d = await r.json() as { available: boolean; error?: string };
        setAvailable(d.available);
        if (!d.available) setError(d.error ?? 'That username is already taken.');
      } catch { setError('Could not check availability.'); }
      finally { setChecking(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value.slice(0, 12));
    setError('');
    setAvailable(null);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!available || saving) return;
    setSaving(true);
    try {
      const r = await fetch('/api/username/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: value }),
      });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (d.ok) { onComplete(value); }
      else { setError(d.error ?? 'Failed to save username.'); }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setSaving(false); }
  }

  const fmtOk = !validateUsernameFormat(value);
  const showTick = fmtOk && available === true && !checking;
  const showX = (fmtOk && available === false) || !!error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsl(var(--background) / 0.92)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' as const }}
        className="w-full max-w-md rounded-2xl p-8 space-y-6"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: 'hsl(var(--primary) / 0.15)' }}>
            <Sparkles className="w-7 h-7" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <h1 className="text-2xl font-serif font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Choose your witch name
          </h1>
          <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            This is your public identity on Spellful. It's how the community will know you.
          </p>
        </div>

        {/* Rules */}
        <ul className="text-xs space-y-1 rounded-xl p-3" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          <li>• 3–12 characters</li>
          <li>• Letters A–Z and digits 0–9 only</li>
          <li>• No spaces, underscores, or special characters</li>
          <li>• Your real name is never shown publicly</li>
        </ul>

        {/* Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              value={value}
              onChange={handleChange}
              placeholder="e.g. MoonWitch42"
              maxLength={12}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className="pr-10 font-mono text-base"
              style={{ background: 'hsl(var(--input))', borderColor: showX ? 'hsl(var(--destructive))' : showTick ? 'hsl(var(--success))' : undefined }}
              aria-label="Choose your username"
              aria-describedby="username-feedback"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AnimatePresence mode="wait">
                {checking && <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--muted-foreground))' }} /></motion.div>}
                {showTick && <motion.div key="tick" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Check className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} /></motion.div>}
                {showX && !checking && <motion.div key="x" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><X className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} /></motion.div>}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                id="username-feedback"
                key="err"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs"
                style={{ color: 'hsl(var(--destructive))' }}
                role="alert"
              >
                {error}
              </motion.p>
            )}
            {showTick && (
              <motion.p
                id="username-feedback"
                key="ok"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs"
                style={{ color: 'hsl(var(--success))' }}
              >
                ✨ {value} is available!
              </motion.p>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            className="w-full"
            disabled={!showTick || saving}
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Claim my witch name ✨'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
