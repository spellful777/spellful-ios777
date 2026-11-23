import { signup } from 'virtual:content';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { authClient, useSession } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Sparkles, Mail, CheckCircle, Check, X, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { validateUsernameFormat, usernameErrorMessage } from '@/lib/username-rules';

const STAR_DATA = Array.from({ length: 40 }, (_, i) => {
  const a = (i * 1664525 + 1013904223) & 0xffffffff;
  const b = (a * 1664525 + 1013904223) & 0xffffffff;
  const c = (b * 1664525 + 1013904223) & 0xffffffff;
  return {
    x: ((a >>> 0) % 10000) / 100,
    y: ((b >>> 0) % 10000) / 100,
    size: 1 + ((c >>> 0) % 3),
    delay: ((a >>> 0) % 40) * 0.1,
    duration: 2 + ((b >>> 0) % 3),
    color: i % 3 === 0 ? 'hsl(var(--primary))' : i % 3 === 1 ? 'hsl(var(--accent))' : 'white',
  };
});

type Step = 'form' | 'verify' | 'avatar';

const AVATAR_PRESETS = [
  { key: 'default-hat-black',   label: 'Midnight',  src: '/airo-assets/images/avatars/default-hat-black' },
  { key: 'default-hat-blue',    label: 'Sapphire',  src: '/airo-assets/images/avatars/default-hat-blue' },
  { key: 'default-hat-green',   label: 'Emerald',   src: '/airo-assets/images/avatars/default-hat-green' },
  { key: 'default-hat-orange',  label: 'Amber',     src: '/airo-assets/images/avatars/default-hat-orange' },
  { key: 'default-hat-purple',  label: 'Amethyst',  src: '/airo-assets/images/avatars/default-hat-purple' },
  { key: 'default-hat-red',     label: 'Crimson',   src: '/airo-assets/images/avatars/default-hat-red' },
  { key: 'default-hat-rainbow', label: 'Rainbow',   src: '/airo-assets/images/avatars/default-hat-rainbow' },
  { key: 'default-hat-trans',   label: 'Trans',     src: '/airo-assets/images/avatars/default-hat-trans' },
  { key: 'default-hat-lesbian', label: 'Lesbian',   src: '/airo-assets/images/avatars/default-hat-lesbian' },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { session, isPending } = useSession();
  const [step, setStep] = useState<Step>('form');

  // Redirect already-authenticated users away from signup
  useEffect(() => {
    if (!isPending && session) {
      navigate('/', { replace: true });
    }
  }, [session, isPending, navigate]);

  // Core auth fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup source — how they found Spellful
  const [signupSource, setSignupSource] = useState<string>(() => {
    // Auto-detect Apple App Store via Capacitor native platform
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      // Capacitor sets window.Capacitor when running natively
      const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
      if (cap?.getPlatform?.() === 'ios') return 'apple_app_store';
      if (cap?.getPlatform?.() === 'android') return 'google_play_store';
      // Fallback: standalone PWA
      if (window.matchMedia('(display-mode: standalone)').matches) return 'pwa';
    }
    return '';
  });

  // OTP / state
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Avatar picker
  const [selectedAvatar, setSelectedAvatar] = useState<string>('default-hat-purple');
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Username field
  const [username, setUsername] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');

  // Debounced username availability check (public — no auth needed)
  useEffect(() => {
    setUsernameAvailable(null);
    setUsernameError('');
    if (!username) return;
    const fmtErr = validateUsernameFormat(username);
    if (fmtErr) { setUsernameError(usernameErrorMessage(fmtErr)); return; }
    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const r = await fetch(`/api/username/check-public?username=${encodeURIComponent(username)}`);
        const d = await r.json() as { available: boolean; error?: string };
        setUsernameAvailable(d.available);
        if (!d.available) setUsernameError(d.error ?? 'That username is already taken.');
      } catch { setUsernameError('Could not check availability.'); }
      finally { setUsernameChecking(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // Validate username before submitting
    if (!username) { setError('Please choose a username.'); return; }
    const fmtErr = validateUsernameFormat(username);
    if (fmtErr) { setError(usernameErrorMessage(fmtErr)); return; }
    if (usernameAvailable === false) { setError('That username is already taken. Please choose another.'); return; }
    if (usernameAvailable === null || usernameChecking) { setError('Please wait while we check your username.'); return; }
    setLoading(true);
    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (!result) {
        setError('Something went wrong. Please try again.');
        return;
      }
      if (result.error) {
        setError(result.error.message ?? 'Could not create account.');
      } else {
        setStep('verify');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function saveSignupMeta() {
    try {
      // Send automated welcome DM from Spellful Team (fire-and-forget)
      void fetch('/api/welcome-message', { method: 'POST', credentials: 'include' });
      // Save signup source if provided (fire-and-forget)
      if (signupSource) {
        void fetch('/api/account/signup-source', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: signupSource }),
        });
      }
      // Save chosen username (authenticated now — session just created)
      if (username) {
        await fetch('/api/username/change', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
      }
    } catch {
      // Non-critical — don't block navigation
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await (authClient as unknown as { emailOtp?: { verifyEmail: (opts: { email: string; otp: string }) => Promise<{ error?: { message?: string } } | undefined> } }).emailOtp?.verifyEmail({ email, otp });
      if (!result) {
        setError('Something went wrong. Please try again.');
        return;
      }
      if (result.error) {
        setError(result.error.message ?? 'Invalid or expired code.');
      } else {
        await saveSignupMeta();
        setStep('avatar');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarContinue() {
    setSavingAvatar(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarPreset: selectedAvatar }),
      });
    } catch {
      // Non-critical — proceed anyway
    } finally {
      setSavingAvatar(false);
    }
    navigate('/');
  }

  async function handleResend() {
    setResending(true);
    setError('');
    try {
      await (authClient as unknown as { emailOtp?: { sendVerificationOtp: (opts: { email: string; type: string }) => Promise<void> } }).emailOtp?.sendVerificationOtp({ email, type: 'email-verification' });
    } catch {
      setError('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  // Don't render while session is resolving
  if (isPending) return null;
  if (session) return null;

  return (
    <>
      <Helmet>
        <title>Create Account — Spellful</title>
        <meta name="description" content="Join Spellful to access your personal grimoire, tarot readings, moon rituals, and more." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background px-4 py-16">
        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none">
          {STAR_DATA.map((star, i) => (
            <motion.div key={i} className="absolute rounded-full"
              style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size, background: star.color, boxShadow: `0 0 ${star.size * 2}px ${star.color}` }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative w-full max-w-md"
        >
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
            {step === 'form' ? (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1))' }}
                  >
                    <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                  </motion.div>
                  <h1 className="font-serif text-3xl text-foreground mb-2">{signup.heading}</h1>
                  <p className="text-sm text-muted-foreground">{signup.subheading}</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-5">
                  {/* ── Core fields ── */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm text-muted-foreground">Name</Label>
                    <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name" required autoComplete="name" className="bg-muted border-border" />
                  </div>

                  {/* ── Username ── */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm text-muted-foreground">
                      Username <span className="text-muted-foreground/60 text-xs">(your public witch name)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={e => { setUsername(e.target.value.slice(0, 12)); setUsernameAvailable(null); setUsernameError(''); }}
                        placeholder="e.g. MoonWitch42"
                        required
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={12}
                        className="bg-muted border-border pr-10 font-mono"
                        style={{
                          borderColor: usernameError ? 'hsl(var(--destructive))' : (usernameAvailable === true ? 'hsl(var(--success))' : undefined),
                        }}
                        aria-describedby="username-hint"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <AnimatePresence mode="wait">
                          {usernameChecking && (
                            <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </motion.div>
                          )}
                          {!usernameChecking && usernameAvailable === true && (
                            <motion.div key="tick" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                              <Check className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} />
                            </motion.div>
                          )}
                          {!usernameChecking && (usernameError || usernameAvailable === false) && (
                            <motion.div key="x" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                              <X className="w-4 h-4 text-destructive" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <AnimatePresence>
                      {usernameError ? (
                        <motion.p key="err" id="username-hint" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-destructive" role="alert">{usernameError}</motion.p>
                      ) : usernameAvailable === true ? (
                        <motion.p key="ok" id="username-hint" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="text-xs" style={{ color: 'hsl(var(--success))' }}>✓ That name is available!</motion.p>
                      ) : (
                        <p id="username-hint" className="text-xs text-muted-foreground">3–12 characters, letters and numbers only</p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com" required autoComplete="email" className="bg-muted border-border" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? 'text' : 'password'} value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                        autoComplete="new-password" className="bg-muted border-border pr-10" minLength={8} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                  </div>

                  {/* ── How did you hear about us? ── */}
                  {signupSource !== 'apple_app_store' && signupSource !== 'google_play_store' && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-source" className="text-sm text-muted-foreground">
                        How did you hear about Spellful? <span className="text-muted-foreground/60">(optional)</span>
                      </Label>
                      <select
                        id="signup-source"
                        value={signupSource}
                        onChange={e => setSignupSource(e.target.value)}
                        className="w-full rounded-md border border-border bg-muted text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option value="">— Select one —</option>
                        <option value="instagram">Instagram</option>
                        <option value="tiktok">TikTok</option>
                        <option value="facebook">Facebook</option>
                        <option value="threads">Threads</option>
                        <option value="bluesky">Bluesky</option>
                        <option value="x_twitter">X / Twitter</option>
                        <option value="youtube">YouTube</option>
                        <option value="pinterest">Pinterest</option>
                        <option value="reddit">Reddit</option>
                        <option value="google_search">Google Search</option>
                        <option value="friend_referral">A friend told me</option>
                        <option value="podcast">Podcast</option>
                        <option value="blog_article">Blog or article</option>
                        <option value="pwa">Added to home screen (PWA)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}
                  {(signupSource === 'apple_app_store' || signupSource === 'google_play_store') && (
                    <p className="text-xs text-muted-foreground text-center">
                      {signupSource === 'apple_app_store' ? '🍎 Joining via the App Store' : '🤖 Joining via Google Play'}
                    </p>
                  )}

                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive text-center">{error}</motion.p>
                  )}

                  <Button type="submit" disabled={loading}
                    className="w-full font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        Creating account…
                      </span>
                    ) : signup.cta}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">✶</span></div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  <span>{signup.signInPrompt}</span>{' '}
                  <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">{signup.signInLink}</Link>
                </p>
              </>
            ) : step === 'avatar' ? (
              <>
                {/* Avatar picker step */}
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1))' }}
                  >
                    <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                  </motion.div>
                  <h1 className="font-serif text-2xl text-foreground mb-1">Choose your witch</h1>
                  <p className="text-sm text-muted-foreground">Pick an avatar for your profile. You can change it anytime.</p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {AVATAR_PRESETS.map(preset => (
                    <button
                      key={preset.key}
                      onClick={() => setSelectedAvatar(preset.key)}
                      className="relative rounded-xl overflow-hidden aspect-square transition-all focus:outline-none"
                      style={{
                        border: selectedAvatar === preset.key
                          ? '2px solid hsl(var(--primary))'
                          : '2px solid hsl(var(--border))',
                        boxShadow: selectedAvatar === preset.key
                          ? '0 0 0 2px hsl(var(--primary) / 0.3)'
                          : 'none',
                      }}
                      aria-label={preset.label}
                      aria-pressed={selectedAvatar === preset.key}
                    >
                      <img
                        src={preset.src}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {selectedAvatar === preset.key && (
                        <div className="absolute inset-0 flex items-end justify-center pb-1.5 pointer-events-none">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                            {preset.label}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => void handleAvatarContinue()}
                  disabled={savingAvatar}
                  className="w-full font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {savingAvatar ? (
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      Saving…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Enter Spellful
                    </span>
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* Verify step — unchanged */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                    <Mail className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <h1 className="font-serif text-3xl text-foreground mb-2">{signup.verifyHeading}</h1>
                  <p className="text-sm text-muted-foreground">
                    <span>{signup.verifySubheading}</span><br />
                    <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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

                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive text-center">{error}</motion.p>
                  )}

                  <Button type="submit" disabled={loading || otp.length < 6}
                    className="w-full font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        Verifying…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />{signup.verifyButton}</span>
                    )}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  <span>{signup.resendPrompt}</span>{' '}
                  <button onClick={handleResend} disabled={resending}
                    className="font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50">
                    {resending ? 'Sending…' : signup.resendLink}
                  </button>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </main>
    </>
  );
}
