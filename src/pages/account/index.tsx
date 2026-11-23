import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { useSession, signOut } from '@/lib/auth/auth-client';
import { useEntitlement } from '@/lib/use-plus-entitlement';
import { SupporterBadge } from '@/components/SupporterBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Star, LogOut, Eye, EyeOff, FileText, ChevronRight, Wand2, Sparkles, Crown, AlertTriangle, Trash2, Monitor } from 'lucide-react';
import { account as pg } from 'virtual:content';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileForm {
  username: string;
  bio: string;
  location: string;
  witchPath: string;
  visibility: 'public' | 'coven' | 'private';
}

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

interface AstroForm {
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  sunSign: string;
  moonSign: string;
  risingSign: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileTab({ userId }: { userId: string }) {
  const [form, setForm] = useState<ProfileForm>({
    username: '', bio: '', location: '', witchPath: '', visibility: 'public',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/account/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setForm({
            username: d.profile.username ?? '',
            bio: d.profile.bio ?? '',
            location: d.profile.location ?? '',
            witchPath: d.profile.witchPath ?? '',
            visibility: d.profile.visibility ?? 'public',
          });

        }
      })
      .catch(() => {});
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      });
      setStatus(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
    }
  }

  const saveLabel =
    status === 'saving' ? pg.profileTab.savingButton :
    status === 'saved'  ? pg.profileTab.savedButton  :
    pg.profileTab.saveButton;

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Profile Studio link — avatar & cover are managed there */}
      <a
        href="/account/profile"
        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 border transition-colors hover:border-primary/60"
        style={{ background: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))' }}
      >
        <div>
          <p className="text-sm font-medium text-foreground">Avatar, cover &amp; appearance</p>
          <p className="text-xs text-muted-foreground">Choose your avatar, cover photo, theme, and accent color in Profile Studio</p>
        </div>
        <svg className="w-4 h-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </a>

      {/* Public profile */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base text-foreground">{pg.profileTab.publicProfileTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">{pg.profileTab.usernameLabel}</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="bg-muted border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">{pg.profileTab.bioLabel}</Label>
            <textarea
              id="bio"
              rows={3}
              value={form.bio}
              placeholder={pg.profileTab.bioPlaceholder}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="location">{pg.profileTab.locationLabel}</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="witchPath">{pg.profileTab.witchPathLabel}</Label>
              <Input
                id="witchPath"
                value={form.witchPath}
                onChange={(e) => setForm((f) => ({ ...f, witchPath: e.target.value }))}
                className="bg-muted border-border"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>{pg.profileTab.visibilityLabel}</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  { val: 'public', label: pg.profileTab.visibilityPublicLabel, desc: pg.profileTab.visibilityPublicDesc },
                  { val: 'coven',  label: pg.profileTab.visibilityCovenLabel,  desc: pg.profileTab.visibilityCovenDesc  },
                  { val: 'private',label: pg.profileTab.visibilityPrivateLabel,desc: pg.profileTab.visibilityPrivateDesc},
                ] as const
              ).map(({ val, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, visibility: val }))}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    form.visibility === val
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted hover:border-primary/40'
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {status === 'error' && (
        <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
      )}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={status === 'saving'} className="bg-primary text-primary-foreground">
          {saveLabel}
        </Button>
        <a href={`/u/${form.username}`} className="text-sm text-primary hover:underline">
          {pg.profileTab.viewProfileLink}
        </a>
      </div>
    </form>
  );
}

interface SessionRow {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
  isCurrent?: boolean;
}

function SecurityTab() {
  const [pwForm, setPwForm] = useState<PasswordForm>({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pwError, setPwError] = useState('');

  // Sessions
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'pending' | 'requested' | 'error'>('idle');
  const [deleteError, setDeleteError] = useState('');
  const [scheduledDeletion, setScheduledDeletion] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/account/sessions', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { sessions?: SessionRow[] }) => { setSessions(d.sessions ?? []); })
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    if (pwForm.next !== pwForm.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.next.length < 12) {
      setPwError('Password must be at least 12 characters.');
      return;
    }
    setPwStatus('saving');
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      if (res.ok) {
        setPwStatus('saved');
        setPwForm({ current: '', next: '', confirm: '' });
        setTimeout(() => setPwStatus('idle'), 2500);
      } else {
        const d = await res.json().catch(() => ({})) as { message?: string; error?: string };
        setPwError(d.message ?? d.error ?? 'Failed to update password.');
        setPwStatus('error');
      }
    } catch {
      setPwError('Network error. Please try again.');
      setPwStatus('error');
    }
  }

  async function revokeSession(id: string) {
    setRevoking(id);
    try {
      await fetch(`/api/account/sessions/${id}`, { method: 'DELETE', credentials: 'include' });
      setSessions((s) => s.filter((x) => x.id !== id));
    } catch {
      // silently ignore
    } finally {
      setRevoking(null);
    }
  }

  async function handleDeleteRequest(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError('');
    setDeleteStatus('pending');
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
        credentials: 'include',
      });
      const d = await res.json().catch(() => ({})) as { ok?: boolean; scheduledDeletionAt?: string; error?: string };
      if (res.ok && d.ok) {
        setDeleteStatus('requested');
        setScheduledDeletion(d.scheduledDeletionAt ?? null);
        setDeletePassword('');
        setShowDeleteConfirm(false);
      } else {
        setDeleteError(d.error ?? 'Failed to request deletion. Check your password.');
        setDeleteStatus('error');
      }
    } catch {
      setDeleteError('Network error. Please try again.');
      setDeleteStatus('error');
    }
  }

  async function handleCancelDeletion() {
    try {
      await fetch('/api/account/delete', { method: 'DELETE', credentials: 'include' });
      setDeleteStatus('idle');
      setScheduledDeletion(null);
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="space-y-8">
      {/* Password */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base text-foreground">{pg.securityTab.passwordSectionTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="current-pw">{pg.securityTab.currentPasswordLabel}</Label>
              <div className="relative">
                <Input
                  id="current-pw"
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                  className="bg-muted border-border pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">{pg.securityTab.newPasswordLabel}</Label>
              <Input
                id="new-pw"
                type={showPw ? 'text' : 'password'}
                value={pwForm.next}
                onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                className="bg-muted border-border"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">{pg.securityTab.confirmPasswordLabel}</Label>
              <Input
                id="confirm-pw"
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                className="bg-muted border-border"
                required
              />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            <Button type="submit" disabled={pwStatus === 'saving'} className="bg-primary text-primary-foreground">
              {pwStatus === 'saving' ? 'Updating…' : pwStatus === 'saved' ? 'Updated ✓' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base text-foreground">{pg.securityTab.sessionsSectionTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other active sessions.</p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  <div className="flex items-start gap-2 min-w-0">
                    <Monitor className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs text-foreground truncate">
                        {s.userAgent ?? 'Unknown device'}
                        {s.isCurrent && (
                          <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                            style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}>
                            current
                          </span>
                        )}
                      </p>
                      {s.ipAddress && <p className="text-xs text-muted-foreground">{s.ipAddress}</p>}
                      {s.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          Started {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {!s.isCurrent && (
                    <button
                      type="button"
                      onClick={() => revokeSession(s.id)}
                      disabled={revoking === s.id}
                      className="shrink-0 text-xs text-destructive hover:underline disabled:opacity-50"
                    >
                      {revoking === s.id ? 'Revoking…' : 'Revoke'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Delete Account ─────────────────────────────────────────────────────── */}
      <Card className="bg-card border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deleteStatus === 'requested' ? (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'hsl(var(--warning))' }} />
                <div>
                  <p className="text-sm font-medium text-foreground">Account deletion scheduled</p>
                  {scheduledDeletion && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your account will be permanently deleted on{' '}
                      <strong>{new Date(scheduledDeletion).toLocaleDateString()}</strong> unless you cancel.
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelDeletion}
                className="border-border text-foreground"
              >
                Cancel deletion
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Permanently delete your Spellful account and all associated data. This action schedules deletion
                in 30 days — you can cancel within that window by signing back in.
              </p>
              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Request account deletion
                </Button>
              ) : (
                <form onSubmit={handleDeleteRequest} className="space-y-3 max-w-sm">
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      This will schedule permanent deletion of your account in 30 days.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="delete-pw" className="text-sm">Confirm your password</Label>
                    <Input
                      id="delete-pw"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="bg-muted border-border"
                      placeholder="Enter your current password"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={deleteStatus === 'pending' || !deletePassword}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteStatus === 'pending' ? 'Requesting…' : 'Confirm deletion'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); setDeletePassword(''); setDeleteStatus('idle'); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AstrologyTab({ userId }: { userId: string }) {
  const [form, setForm] = useState<AstroForm>({
    birthDate: '', birthTime: '', birthLocation: '',
    sunSign: '', moonSign: '', risingSign: '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/account/astrology')
      .then((r) => r.json())
      .then((d) => {
        if (d.astrology) setForm(d.astrology);
      })
      .catch(() => {});
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      const res = await fetch('/api/account/astrology', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSave}>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base text-foreground">{pg.astroTab.sectionTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="birthDate">{pg.astroTab.birthDateLabel}</Label>
              <Input
                id="birthDate"
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthTime">{pg.astroTab.birthTimeLabel}</Label>
              <Input
                id="birthTime"
                type="time"
                value={form.birthTime}
                onChange={(e) => setForm((f) => ({ ...f, birthTime: e.target.value }))}
                className="bg-muted border-border"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthLocation">{pg.astroTab.birthLocationLabel}</Label>
            <Input
              id="birthLocation"
              value={form.birthLocation}
              onChange={(e) => setForm((f) => ({ ...f, birthLocation: e.target.value }))}
              className="bg-muted border-border"
              placeholder="City, Country"
            />
          </div>

          <Separator className="bg-border" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                { key: 'sunSign',    label: pg.astroTab.sunSignLabel    },
                { key: 'moonSign',   label: pg.astroTab.moonSignLabel   },
                { key: 'risingSign', label: pg.astroTab.risingSignLabel },
              ] as const
            ).map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <select
                  id={key}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— select —</option>
                  {pg.ZODIAC_SIGNS.map((sign) => (
                    <option key={sign} value={sign}>{sign}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {status === 'error' && (
            <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
          )}

          <Button type="submit" disabled={status === 'saving'} className="bg-primary text-primary-foreground">
            {status === 'saving' ? 'Saving…' : status === 'saved' ? pg.astroTab.savedButton : pg.astroTab.saveButton}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const { data: ent } = useEntitlement();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  const user = session.user;

  return (
    <>
      <Helmet>
        <title>{pg.meta.title}</title>
        <meta name="description" content={pg.meta.description} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="sr-only">{pg.meta.title}</h1>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img src={user.image} alt={user.name ?? 'Avatar'} className="w-12 h-12 rounded-full object-cover border-2 border-primary/40" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground">{user.name ?? user.email}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <LogOut className="w-4 h-4" />
            {pg.header.signOutButton}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList className="bg-muted border border-border mb-6 w-full grid grid-cols-3">
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="w-4 h-4" />
              {pg.tabs.profile}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <Shield className="w-4 h-4" />
              {pg.tabs.security}
            </TabsTrigger>
            <TabsTrigger value="astrology" className="gap-1.5">
              <Star className="w-4 h-4" />
              {pg.tabs.astrology}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab userId={user.id} />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>
          <TabsContent value="astrology">
            <AstrologyTab userId={user.id} />
          </TabsContent>
        </Tabs>

        {/* ── Platform Owner section — visible only to role=owner ── */}
        {(user as { platformRole?: string }).platformRole === 'owner' && (
          <div className="mt-6 mb-2 rounded-2xl border overflow-hidden"
            style={{ borderColor: 'hsl(var(--primary) / 0.5)', background: 'hsl(var(--card))' }}>
            {/* Header bar */}
            <div className="px-5 py-4 flex items-center gap-3"
              style={{ background: 'hsl(var(--primary) / 0.08)', borderBottom: '1px solid hsl(var(--primary) / 0.2)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(var(--primary) / 0.18)' }}>
                <Crown className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold tracking-wide" style={{ color: 'hsl(var(--primary))' }}>
                  Platform Administration
                </p>
                <p className="text-xs text-muted-foreground">Account Role: Platform Owner · Full Administrative Access</p>
              </div>
            </div>

            {/* Open Admin Dashboard CTA */}
            <div className="px-5 py-4">
              <Link to="/admin/dashboard">
                <Button className="w-full font-semibold text-sm py-3"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  <Crown className="w-4 h-4 mr-2" />
                  Open Admin Dashboard
                </Button>
              </Link>
            </div>

            {/* Owner-only admin links */}
            <div className="px-5 pb-4 grid grid-cols-1 gap-2">
              {[
                { to: '/admin/roles',          icon: <Shield className="w-4 h-4" />,   label: 'Roles & Permissions',      desc: 'Manage member roles and the permission matrix' },
                { to: '/admin/applications',   icon: <FileText className="w-4 h-4" />, label: 'Member Applications',      desc: 'Review creator and organization applications' },
                { to: '/admin/community',      icon: <Wand2 className="w-4 h-4" />,    label: 'Community Moderation',     desc: 'Reports, content review, and mod log' },
                { to: '/admin/community-admin',icon: <Star className="w-4 h-4" />,     label: 'Community Admin Console',  desc: 'Forums, moderator assignments, pinned posts' },
                { to: '/admin/spells',         icon: <Sparkles className="w-4 h-4" />, label: 'Spells Management',        desc: 'Review and approve submitted spells' },
              ].map((item) => (
                <Link key={item.to} to={item.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border hover:border-primary/40 transition-colors"
                  style={{ background: 'hsl(var(--muted))' }}>
                  <span className="flex-shrink-0" style={{ color: 'hsl(var(--primary))' }}>{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Spellful Plus card — subtle, non-pushy */}
        <div className="mt-6">
          {ent.isPlus ? (
            /* Subscriber: show status */
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30"
              style={{ background: 'hsl(var(--primary) / 0.06)' }}>
              <SupporterBadge size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>
                  Plus member
                </p>
                {ent.expiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Renews {new Date(ent.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Link to="/plus">
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  View benefits
                </button>
              </Link>
            </div>
          ) : (
            /* Free user: subtle Explore Plus card */
            <Link to="/plus"
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:border-primary/40 transition-colors"
              style={{ background: 'hsl(var(--card))' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(var(--primary) / 0.12)' }}>
                <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Explore Spellful Plus</p>
                <p className="text-xs text-muted-foreground">
                  Make Spellful your own — the knowledge stays free
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Link>
          )}
        </div>

        {/* Role-gated console links */}
        {(() => {
          const role = (user as { platformRole?: string }).platformRole ?? 'member';
          const isAdmin = ['admin', 'owner'].includes(role);
          const isMod = ['moderator', 'admin', 'owner'].includes(role);
          if (!isMod) {
            // All authenticated users see My Applications
            return (
              <div className="mt-6 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Applications</p>
                <Link to="/account/applications"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">My Applications</p>
                    <p className="text-xs text-muted-foreground">Creator and organization applications</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            );
          }
          return (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                {isAdmin ? 'Admin & Moderation' : 'Moderation'}
              </p>
              {isAdmin && (
                <Link to="/admin/dashboard"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                  <Shield className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Admin Dashboard</p>
                    <p className="text-xs text-muted-foreground">Platform overview, applications, reports</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/applications"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--warning))' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Application Review</p>
                    <p className="text-xs text-muted-foreground">Review creator and organization applications</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}
              <Link to="/admin/moderator"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                <Shield className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Moderator Console</p>
                  <p className="text-xs text-muted-foreground">Scoped report queue for your assigned forums</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              {isAdmin && (
                <Link to="/admin/community-admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                  <Wand2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--secondary))' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Community Admin Console</p>
                    <p className="text-xs text-muted-foreground">Manage forums, moderators, and pinned posts</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              )}
              <Link to="/account/applications"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                <FileText className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">My Applications</p>
                  <p className="text-xs text-muted-foreground">Your creator and organization applications</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>
          );
        })()}
      </main>
    </>
  );
}
