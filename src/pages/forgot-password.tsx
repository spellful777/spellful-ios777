import { forgot_password } from 'virtual:content';
import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { authClient } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Sparkles, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

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

type Step = 'email' | 'code' | 'newpassword' | 'done';

type EmailOtpClient = {
  emailOtp?: {
    sendVerificationOtp: (opts: { email: string; type: string }) => Promise<{ error?: { message?: string } }>;
    resetPassword: (opts: { email: string; otp: string; password: string }) => Promise<{ error?: { message?: string } }>;
  };
};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const c = forgot_password;

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await (authClient as unknown as EmailOtpClient).emailOtp?.sendVerificationOtp({ email, type: 'forget-password' });
      if (result?.error) {
        setError(result.error.message ?? 'Could not send reset code. Please try again.');
      } else {
        setStep('code');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    try {
      await (authClient as unknown as EmailOtpClient).emailOtp?.sendVerificationOtp({ email, type: 'forget-password' });
    } catch {
      setError('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setError('');
    setStep('newpassword');
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await (authClient as unknown as EmailOtpClient).emailOtp?.resetPassword({ email, otp, password: newPassword });
      if (result?.error) {
        setError(result.error.message ?? 'Could not reset password. The code may have expired.');
        setStep('code');
        setOtp('');
      } else {
        setStep('done');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Reset Password — Spellful</title>
        <meta name="description" content="Reset your Spellful account password." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background px-4 py-16">
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

            {/* ── Step 1: Enter email ── */}
            {step === 'email' && (
              <>
                <div className="text-center mb-8">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1))' }}
                  >
                    <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                  </motion.div>
                  <h1 className="font-serif text-3xl text-foreground mb-2">{c.emailStep.title}</h1>
                  <p className="text-sm text-muted-foreground">{c.emailStep.subtitle}</p>
                </div>

                <form onSubmit={handleSendCode} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-muted-foreground">{c.emailStep.emailLabel}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      autoComplete="email"
                      className="bg-muted border-border"
                    />
                  </div>

                  {error && <p className="text-sm text-destructive text-center">{error}</p>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? c.emailStep.submittingButton : c.emailStep.submitButton}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  <Link to="/login" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors">
                    <ArrowLeft className="w-3 h-3" />
                    <span>{c.emailStep.backToSignIn}</span>
                  </Link>
                </p>
              </>
            )}

            {/* ── Step 2: Enter OTP ── */}
            {step === 'code' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1))' }}>
                    <Mail className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <h1 className="font-serif text-3xl text-foreground mb-2">{c.codeStep.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    <span>{c.sentTo}</span><br />
                    <span className="text-foreground font-medium">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div className="flex flex-col items-center gap-3">
                    <Label className="text-sm text-muted-foreground">{c.codeStep.codeLabel}</Label>
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

                  {error && <p className="text-sm text-destructive text-center">{error}</p>}

                  <Button type="submit" className="w-full" disabled={otp.length < 6}>
                    {c.codeStep.continueButton}
                  </Button>
                </form>

                <div className="text-center mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span>{c.codeStep.resendPrompt}</span>{' '}
                    <button type="button" onClick={handleResend} disabled={resending}
                      className="text-primary hover:text-primary/80 transition-colors disabled:opacity-50">
                      {resending ? c.codeStep.resendingButton : c.codeStep.resendButton}
                    </button>
                  </p>
                  <p>
                    <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ArrowLeft className="w-3 h-3" />
                      <span>{c.codeStep.changeEmailButton}</span>
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* ── Step 3: New password ── */}
            {step === 'newpassword' && (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.1))' }}>
                    <Sparkles className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <h1 className="font-serif text-3xl text-foreground mb-2">{c.passwordStep.title}</h1>
                  <p className="text-sm text-muted-foreground">{c.passwordStep.subtitle}</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="newpw" className="text-sm text-muted-foreground">{c.passwordStep.newPasswordLabel}</Label>
                    <Input id="newpw" type="password" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required autoComplete="new-password" minLength={8}
                      className="bg-muted border-border" />
                    <p className="text-xs text-muted-foreground">{c.passwordStep.passwordHint}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmpw" className="text-sm text-muted-foreground">{c.passwordStep.confirmPasswordLabel}</Label>
                    <Input id="confirmpw" type="password" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required autoComplete="new-password"
                      className="bg-muted border-border" />
                  </div>

                  {error && <p className="text-sm text-destructive text-center">{error}</p>}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? c.passwordStep.submittingButton : c.passwordStep.submitButton}
                  </Button>
                </form>
              </>
            )}

            {/* ── Step 4: Done ── */}
            {step === 'done' && (
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                  style={{ background: 'hsl(var(--success) / 0.15)' }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: 'hsl(var(--success))' }} />
                </motion.div>
                <h1 className="font-serif text-3xl text-foreground mb-3">{c.doneStep.title}</h1>
                <p className="text-sm text-muted-foreground mb-8">{c.doneStep.message}</p>
                <Link to="/login">
                  <Button className="w-full">{c.doneStep.signInButton}</Button>
                </Link>
              </div>
            )}

          </div>
        </motion.div>
      </main>
    </>
  );
}
