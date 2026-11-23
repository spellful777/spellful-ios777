import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Moon, Sparkles, Bell, BellOff, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSession } from '@/lib/auth/auth-client';
import { reminders as remindersContent } from 'virtual:content';

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/reminders`;

interface ReminderPrefs {
  fullMoonReminder: boolean;
  newMoonReminder: boolean;
  quarterMoonReminder: boolean;
  tarotReminder: boolean;
  dreamJournalReminder: boolean;
  ritualReminder: boolean;
  emailNotifications: boolean;
  reminderDaysBefore: number;
  timezone: string;
}

const DEFAULT_PREFS: ReminderPrefs = {
  fullMoonReminder: false,
  newMoonReminder: false,
  quarterMoonReminder: false,
  tarotReminder: false,
  dreamJournalReminder: false,
  ritualReminder: false,
  emailNotifications: true,
  reminderDaysBefore: 1,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

const REMINDER_GROUPS = [
  {
    title: 'Moon Events',
    icon: Moon,
    color: '--accent',
    items: [
      { key: 'fullMoonReminder' as const, label: 'Full Moon', desc: 'Reminder before each full moon' },
      { key: 'newMoonReminder' as const, label: 'New Moon', desc: 'Reminder before each new moon' },
      { key: 'quarterMoonReminder' as const, label: 'Quarter Moons', desc: 'First and last quarter reminders' },
    ],
  },
  {
    title: 'Spiritual Practice',
    icon: Sparkles,
    color: '--primary',
    items: [
      { key: 'tarotReminder' as const, label: 'Tarot Reflection', desc: 'Weekly reminder to pull a card' },
      { key: 'dreamJournalReminder' as const, label: 'Dream Journal', desc: 'Morning reminder to record dreams' },
      { key: 'ritualReminder' as const, label: 'Ritual Practice', desc: 'Reminder for saved rituals' },
    ],
  },
];

export default function RemindersPage() {
  const { session, isPending } = useSession();
  const [prefs, setPrefs] = useState<ReminderPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    fetch('/api/reminders')
      .then((r) => r.json())
      .then((data: ReminderPrefs) => {
        setPrefs({ ...DEFAULT_PREFS, ...data });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function toggle(key: keyof ReminderPrefs) {
    // eslint-disable-next-line security/detect-object-injection
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (!isPending && !session) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'hsl(var(--background))' }}>
        <div className="text-center max-w-sm">
          <BellOff size={48} className="mx-auto mb-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <h1 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
            {remindersContent.labels.signin_heading}
          </h1>
          <p className="mb-6 text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
            {remindersContent.labels.signin_body}
          </p>
          <Link to="/signup" className="inline-block px-6 py-3 rounded-full font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
            {remindersContent.labels.signin_cta}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reminders &amp; Notifications | Spellful</title>
        <meta name="description" content="Set up personalized reminders for full moons, new moons, tarot reflections, and spiritual practices." />
        <link rel="canonical" href={pageUrl} />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main style={{ background: 'hsl(var(--background))' }}>
        <section className="pt-16 pb-20 px-6 md:px-10">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                  <Bell size={20} style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <h1 className="text-3xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  {remindersContent.hero.title}
                </h1>
              </div>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                {remindersContent.hero.subtitle}
              </p>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin" style={{ color: 'hsl(var(--primary))' }} />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Reminder groups */}
                {REMINDER_GROUPS.map((group, gi) => {
                  const Icon = group.icon;
                  return (
                    <motion.div
                      key={group.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: gi * 0.1 }}
                      className="rounded-2xl p-6"
                      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    >
                      <div className="flex items-center gap-2 mb-5">
                        <Icon size={18} style={{ color: `hsl(var(${group.color}))` }} />
                        <h2 className="text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{group.title}</h2>
                      </div>
                      <div className="space-y-4">
                        {group.items.map(({ key, label, desc }) => {
                          // eslint-disable-next-line security/detect-object-injection
                          const prefValue = prefs[key] as boolean;
                          return (
                          <div key={key} className="flex items-center justify-between gap-4">
                            <div>
                              <Label htmlFor={key} className="text-sm font-medium cursor-pointer" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                                {label}
                              </Label>
                              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{desc}</p>
                            </div>
                            <Switch
                              id={key}
                              checked={prefValue}
                              onCheckedChange={() => toggle(key)}
                            />
                          </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Notification settings */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="rounded-2xl p-6"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <Bell size={18} style={{ color: 'hsl(var(--muted-foreground))' }} />
                    <h2 className="text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Notification Settings</h2>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label htmlFor="emailNotifications" className="text-sm font-medium cursor-pointer" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                          Email notifications
                        </Label>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Receive reminders at your account email</p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={prefs.emailNotifications}
                        onCheckedChange={() => toggle('emailNotifications')}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                        Remind me
                      </Label>
                      <Select
                        value={String(prefs.reminderDaysBefore)}
                        onValueChange={(v) => setPrefs((p) => ({ ...p, reminderDaysBefore: parseInt(v, 10) }))}
                      >
                        <SelectTrigger className="w-full" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                          <SelectItem value="0" style={{ color: 'hsl(var(--foreground))' }}>Same day</SelectItem>
                          <SelectItem value="1" style={{ color: 'hsl(var(--foreground))' }}>1 day before</SelectItem>
                          <SelectItem value="2" style={{ color: 'hsl(var(--foreground))' }}>2 days before</SelectItem>
                          <SelectItem value="3" style={{ color: 'hsl(var(--foreground))' }}>3 days before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>

                {/* Save button */}
                {error && (
                  <p className="text-sm text-center" style={{ color: 'hsl(var(--destructive))', fontFamily: 'var(--font-sans)' }}>{error}</p>
                )}

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full gap-2 py-3"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin" /> {remindersContent.labels.saving}</>
                  ) : saved ? (
                    <><Check size={16} /> {remindersContent.labels.saved}</>
                  ) : (
                    <>{remindersContent.labels.save_button}</>
                  )}
                </Button>

                <p className="text-xs text-center" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {remindersContent.labels.consent_note}
                </p>

                {/* Quick links */}
                <div className="flex flex-wrap gap-3 justify-center pt-4">
                  <Link to="/moon-calendar" className="text-xs px-4 py-2 rounded-full" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Moon Calendar
                  </Link>
                  <Link to="/grimoire" className="text-xs px-4 py-2 rounded-full" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    My Grimoire
                  </Link>
                  <Link to="/dashboard" className="text-xs px-4 py-2 rounded-full" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
