import { login } from 'virtual:content';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { authClient, useSession } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// ── Daily sign-in message — changes each day, stable all day ─────────────────
const DAILY_MESSAGES = [
  'Sign in to your sacred space',
  'The cards are waiting for you',
  'Your grimoire remembers everything',
  'The moon has been watching over you',
  'Your magic doesn\'t sleep — neither does your sanctuary',
  'Step back into the mystery',
  'The stars aligned to bring you here',
  'Your rituals are ready to continue',
  'Something shifted while you were away',
  'The veil is thin — come through',
  'Your path continues here',
  'The cosmos kept your place',
  'Every return is a new beginning',
  'Your intentions are still burning',
  'The grimoire has been waiting',
  'Magic flows where you go',
  'The moon remembers your name',
  'Your sanctuary is always open',
  'Step into the light you carry',
  'The ritual continues',
  'Your energy never left this space',
  'The stars have stories for you',
  'Come back to what calls you',
  'Your practice is your power',
  'The mystery deepens with every visit',
  'Something is ready to be revealed',
  'The wheel keeps turning — so do you',
  'Your magic is always here',
  'The candle was never extinguished',
  'Return to the work that matters',
  'The universe held your seat',
];

function getDailyMessage(): string {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_MESSAGES[dayOfYear % DAILY_MESSAGES.length];
}

// ── Seeded star field ─────────────────────────────────────────────────────────
const STARS = Array.from({ length: 70 }, (_, i) => {
  const a = Math.abs((i * 1664525 + 1013904223) & 0x7fffffff);
  const b = Math.abs((a * 1664525 + 1013904223) & 0x7fffffff);
  const c = Math.abs((b * 1664525 + 1013904223) & 0x7fffffff);
  const d = Math.abs((c * 1664525 + 1013904223) & 0x7fffffff);
  return {
    x: (a % 10000) / 100,
    y: (b % 10000) / 100,
    size: 1 + (c % 3),
    delay: (d % 50) * 0.08,
    duration: 2.5 + (a % 4),
    kind: i % 5,
  };
});

// ── Floating sigil glyphs ─────────────────────────────────────────────────────
const GLYPHS = ['☽', '✦', '⊕', '☿', '♄', '⚸', '✧', '⊗'];
const GLYPH_DATA = Array.from({ length: 8 }, (_, i) => {
  const a = Math.abs(((i + 7) * 1664525 + 1013904223) & 0x7fffffff);
  const b = Math.abs((a * 1664525 + 1013904223) & 0x7fffffff);
  return {
    glyph: GLYPHS[i],
    x: 5 + (a % 90),
    y: 5 + (b % 90),
    delay: i * 0.7,
    duration: 6 + (a % 6),
    drift: 10 + (b % 20),
  };
});

type Step = 'form' | 'twofa';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, isPending } = useSession();

  // Safe redirect: only allow paths within Spellful (no external URLs).
  // Account/profile pages are settings destinations — after sign-in we always
  // send members to their Sanctuary instead, so login feels like a homecoming.
  const safeRedirect = useCallback((): string => {
    const settingsPaths = ['/account', '/account/profile'];
    const raw = searchParams.get('redirect') ?? '';
    if (raw.startsWith('/') && !raw.startsWith('//') && !settingsPaths.includes(raw)) {
      return raw;
    }
    return '/sanctuary';
  }, [searchParams]);
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (!isPending && session) navigate(safeRedirect(), { replace: true });
  }, [session, isPending, navigate, safeRedirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authClient.signIn.email({ email, password, rememberMe });
      if (!result) {
        setError('Something went wrong. Please try again.');
        return;
      }
      if (result.error) {
        if (result.error.code === 'TWO_FACTOR_REQUIRED' || result.error.message?.includes('two factor')) {
          setStep('twofa');
        } else {
          setError(result.error.message ?? 'Invalid email or password.');
        }
      } else {
        navigate(safeRedirect());
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFa(e: React.FormEvent) {
    e.preventDefault();
    if (twoFaCode.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const twoFactor = (authClient as unknown as { twoFactor?: { verifyTotp: (opts: { code: string }) => Promise<{ error?: { message?: string } }> } }).twoFactor;
      const result = await twoFactor?.verifyTotp({ code: twoFaCode });
      if (result?.error) {
        setError(result.error.message ?? 'Invalid code. Please try again.');
      } else {
        navigate(safeRedirect());
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (isPending) return null;
  if (session) return null;

  const c = login;

  return (
    <>
      <Helmet>
        <title>Sign In — Spellful</title>
        <meta name="description" content="Sign in to your Spellful account to access your personal grimoire, saved readings, and mystical tools." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main
        className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-16"
        style={{ background: `radial-gradient(ellipse 120% 80% at 50% 0%, hsl(var(--login-bg-top)) 0%, hsl(var(--login-bg-mid)) 55%, hsl(var(--login-bg-deep)) 100%)` }}
      >
        {/* Deep nebula layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: `radial-gradient(ellipse, hsl(var(--login-nebula-purple) / 0.35) 0%, transparent 70%)`, filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: '-10%', width: '50vw', height: '40vh', background: `radial-gradient(ellipse, hsl(var(--login-nebula-gold) / 0.12) 0%, transparent 70%)`, filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: '30%', left: '-5%', width: '30vw', height: '30vh', background: `radial-gradient(ellipse, hsl(var(--login-nebula-soft) / 0.2) 0%, transparent 70%)`, filter: 'blur(50px)' }} />
        </div>

        {/* Star field */}
        <div className="absolute inset-0 pointer-events-none">
          {STARS.map((star, i) => {
            const color = star.kind === 0 ? 'hsl(var(--primary))' : star.kind === 1 ? 'hsl(var(--accent))' : 'rgba(255,255,255,0.9)';
            return (
              <motion.div key={i} className="absolute rounded-full"
                style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, background: color, boxShadow: `0 0 ${star.size * 3}px ${color}` }}
                animate={{ opacity: [0.15, 0.9, 0.15], scale: [0.7, 1.3, 0.7] }}
                transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
              />
            );
          })}
        </div>

        {/* Floating sigil glyphs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {GLYPH_DATA.map((g, i) => (
            <motion.span key={i}
              className="absolute select-none"
              style={{ left: `${g.x}%`, top: `${g.y}%`, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: i % 2 === 0 ? 'hsl(var(--primary) / 0.25)' : 'hsl(var(--accent) / 0.2)' }}
              animate={{ y: [-g.drift / 2, g.drift / 2, -g.drift / 2], opacity: [0.15, 0.45, 0.15], rotate: [-5, 5, -5] }}
              transition={{ duration: g.duration, delay: g.delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              {g.glyph}
            </motion.span>
          ))}
        </div>

        {/* Moon orb above card */}
        <div className="absolute pointer-events-none" style={{ top: '6vh', left: '50%', transform: 'translateX(-50%)' }}>
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'relative', width: 72, height: 72 }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'absolute', inset: -16, borderRadius: '50%', background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)' }}
            />
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, hsl(var(--login-moon-light)), hsl(var(--primary)) 50%, hsl(var(--login-nebula-gold)))`, boxShadow: '0 0 30px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.2)' }} />
            <div style={{ position: 'absolute', top: 6, right: 6, width: 52, height: 52, borderRadius: '50%', background: 'hsl(var(--login-moon-shadow) / 0.45)', filter: 'blur(4px)' }} />
          </motion.div>
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          className="relative w-full max-w-md mt-0"
        >
          {/* Card border glow */}
          <div style={{ position: 'absolute', inset: -1, borderRadius: 20, background: 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.1))', filter: 'blur(1px)', zIndex: 0 }} />

          <div
            className="relative rounded-2xl p-8 overflow-hidden"
            style={{ background: `linear-gradient(160deg, hsl(var(--login-card-top)) 0%, hsl(var(--login-card-mid)) 60%, hsl(var(--login-card-deep)) 100%)`, border: '1px solid hsl(var(--primary) / 0.25)', zIndex: 1, boxShadow: `0 24px 80px hsl(var(--login-card-darkest) / 0.8), 0 0 0 1px hsl(var(--accent) / 0.08) inset` }}
          >
            {/* Top shimmer */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.4), transparent)' }} />

            <AnimatePresence mode="wait">
              {step === 'form' ? (
                <motion.div key="form"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="text-center mb-8">
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'hsl(var(--primary) / 0.7)', marginBottom: '0.75rem' }}>
                      ✦ &nbsp; Welcome Back &nbsp; ✦
                    </p>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 2.6rem)', fontWeight: 400, color: 'hsl(var(--foreground))', lineHeight: 1.15, marginBottom: '0.5rem' }}>
                      {c.title}
                    </h1>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))', fontStyle: 'italic' }}>
                      {getDailyMessage()}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                        {c.emailLabel}
                      </Label>
                      <div style={{ position: 'relative' }}>
                        <Input
                          id="email" type="email" value={email}
                          onChange={e => setEmail(e.target.value)}
                          onFocus={() => setFocused('email')}
                          onBlur={() => setFocused(null)}
                          placeholder="your@email.com" required autoComplete="email"
                          style={{
                            background: 'hsl(var(--login-input-bg) / 0.8)',
                            border: `1px solid ${focused === 'email' ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--border))'}`,
                            color: 'hsl(var(--foreground))',
                            transition: 'border-color 0.2s',
                            boxShadow: focused === 'email' ? '0 0 0 3px hsl(var(--primary) / 0.1)' : 'none',
                          }}
                        />
                        {focused === 'email' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))', fontSize: '0.7rem', pointerEvents: 'none' }}>
                            ✦
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                          {c.passwordLabel}
                        </Label>
                        <Link to="/forgot-password" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'hsl(var(--accent))', textDecoration: 'none' }}
                          className="hover:opacity-80 transition-opacity">
                          {c.forgotPassword}
                        </Link>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <Input
                          id="password" type={showPassword ? 'text' : 'password'} value={password}
                          onChange={e => setPassword(e.target.value)}
                          onFocus={() => setFocused('password')}
                          onBlur={() => setFocused(null)}
                          placeholder="••••••••" required autoComplete="current-password"
                          style={{
                            background: 'hsl(var(--login-input-bg) / 0.8)',
                            border: `1px solid ${focused === 'password' ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--border))'}`,
                            color: 'hsl(var(--foreground))',
                            paddingRight: '2.75rem',
                            transition: 'border-color 0.2s',
                            boxShadow: focused === 'password' ? '0 0 0 3px hsl(var(--primary) / 0.1)' : 'none',
                          }}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: 'hsl(var(--muted-foreground))' }}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Keep me signed in */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                      <span
                        role="checkbox"
                        aria-checked={rememberMe}
                        tabIndex={0}
                        onClick={() => setRememberMe(v => !v)}
                        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setRememberMe(v => !v); } }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: `1px solid ${rememberMe ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                          background: rememberMe ? 'hsl(var(--primary) / 0.15)' : 'transparent',
                          transition: 'all 0.15s',
                          boxShadow: rememberMe ? '0 0 0 2px hsl(var(--primary) / 0.2)' : 'none',
                        }}
                      >
                        {rememberMe && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                            style={{ color: 'hsl(var(--primary))', fontSize: '0.65rem', lineHeight: 1 }}>
                            ✦
                          </motion.span>
                        )}
                      </span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'hsl(var(--muted-foreground))' }}>
                        Keep me signed in
                      </span>
                    </label>

                    <AnimatePresence>
                      {error && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'hsl(var(--destructive))', textAlign: 'center', padding: '0.5rem 0.75rem', background: 'hsl(var(--destructive) / 0.08)', borderRadius: 8, border: '1px solid hsl(var(--destructive) / 0.2)' }}>
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button type="submit" disabled={loading} className="w-full relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--login-btn-dark)))`, color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em', fontSize: '0.85rem', height: 46, border: 'none', boxShadow: '0 4px 20px hsl(var(--primary) / 0.35)' }}>
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                            <span>{c.submittingButton}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 justify-center">
                            <span>☽</span>
                            <span>{c.submitButton}</span>
                            <span>☾</span>
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </form>

                  <div className="relative my-7">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full" style={{ borderTop: '1px solid hsl(var(--border))' }} />
                    </div>
                    <div className="relative flex justify-center">
                      <span style={{ background: 'hsl(var(--login-divider-bg))', padding: '0 0.75rem', fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'hsl(var(--primary) / 0.6)' }}>
                        ✦
                      </span>
                    </div>
                  </div>

                  <p style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'hsl(var(--muted-foreground))' }}>
                    <span>{c.noAccount}</span>{' '}
                    <Link to="/signup" style={{ color: 'hsl(var(--accent))', fontWeight: 500, textDecoration: 'none' }}
                      className="hover:opacity-80 transition-opacity">
                      {c.createAccount}
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div key="twofa"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="text-center mb-8">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                      style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1))', border: '1px solid hsl(var(--primary) / 0.3)' }}
                    >
                      <ShieldCheck className="w-7 h-7" style={{ color: 'hsl(var(--primary))' }} />
                    </motion.div>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 400, color: 'hsl(var(--foreground))', marginBottom: '0.5rem' }}>
                      {c.twoFaTitle}
                    </h1>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                      {c.twoFaSubtitle}
                    </p>
                  </div>

                  <form onSubmit={handleTwoFa} className="space-y-6">
                    <div className="flex flex-col items-center gap-3">
                      <Label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', letterSpacing: '0.08em', color: 'hsl(var(--muted-foreground))' }}>
                        {c.twoFaCodeLabel}
                      </Label>
                      <InputOTP maxLength={6} value={twoFaCode} onChange={setTwoFaCode}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'hsl(var(--destructive))', textAlign: 'center', padding: '0.5rem 0.75rem', background: 'hsl(var(--destructive) / 0.08)', borderRadius: 8, border: '1px solid hsl(var(--destructive) / 0.2)' }}>
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button type="submit" disabled={loading || twoFaCode.length < 6} className="w-full"
                        style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--login-btn-dark)))`, color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em', fontSize: '0.85rem', height: 46, border: 'none', boxShadow: '0 4px 20px hsl(var(--primary) / 0.35)' }}>
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                            <span>{c.twoFaVerifyingButton}</span>
                          </span>
                        ) : <span>{c.twoFaSubmitButton}</span>}
                      </Button>
                    </motion.div>
                  </form>

                  <p style={{ textAlign: 'center', marginTop: '1.25rem', fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}>
                    <button type="button" onClick={() => { setStep('form'); setTwoFaCode(''); setError(''); }}
                      style={{ color: 'hsl(var(--accent))', background: 'none', border: 'none', cursor: 'pointer' }}
                      className="hover:opacity-80 transition-opacity">
                      {c.twoFaBackButton}
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom shimmer */}
            <div style={{ position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.3), transparent)' }} />
          </div>
        </motion.div>
      </main>
    </>
  );
}
