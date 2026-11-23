import { useState, useEffect } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { useSession } from '@/lib/auth/auth-client';
import { circles as pageContent } from 'virtual:content';
import { Users, Sparkles, Lock, Globe } from 'lucide-react';

interface Circle {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  membership_type: string;
  member_count: number;
  my_status: string | null;
}

export default function CirclesPage() {
  const { session } = useSession();
  const myId = (session?.user as { id?: string } | undefined)?.id ?? null;

  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/circles', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { circles?: Circle[] }) => {
        if (d.circles) setCircles(d.circles);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function handleJoin(circleId: number) {
    if (!myId) { window.location.href = '/signup'; return; }
    setJoining(circleId);
    try {
      const res = await fetch(`/api/circles/${circleId}/join`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { joined: boolean };
        setCircles((prev) =>
          prev.map((c) =>
            c.id === circleId
              ? { ...c, my_status: data.joined ? 'active' : null, member_count: c.member_count + (data.joined ? 1 : -1) }
              : c,
          ),
        );
      }
    } finally {
      setJoining(null);
    }
  }

  return (
    <>
      <Helmet>
        <title>Spellful Circles — Find Your Community</title>
        <meta name="description" content="Join opt-in interest communities on Spellful — Herbalists' Circle, Tarot Study Circle, Lunar Practice Circle, and more." />
        <meta property="og:title" content="Spellful Circles" />
        <meta property="og:description" content="Find your people. Join communities built around shared magical interests." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/circles" />
        <meta property="og:image" content="https://spellful.com/airo-assets/images/pages/og-image" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Spellful Circles" />
        <meta name="twitter:description" content="Find your people. Join communities built around shared magical interests." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/images/pages/og-image" />
      </Helmet>

      <main className="min-h-screen py-12 px-4" style={{ background: 'hsl(var(--background))' }}>
        <div className="max-w-4xl mx-auto">

          {/* Hero */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.25)' }}
            >
              <Sparkles className="w-3 h-3" />
              <span>{pageContent.hero.badge}</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {pageContent.hero.title}
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {pageContent.hero.subtitle}
            </p>
          </motion.div>

          {/* Circles grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div className="h-8 w-8 rounded-full mb-3" style={{ background: 'hsl(var(--muted))' }} />
                  <div className="h-5 w-40 rounded mb-2" style={{ background: 'hsl(var(--muted))' }} />
                  <div className="h-4 w-full rounded" style={{ background: 'hsl(var(--muted))' }} />
                </div>
              ))}
            </div>
          ) : circles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {circles.map((circle, idx) => {
                const isMember = circle.my_status === 'active';
                const isJoining = joining === circle.id;
                return (
                  <motion.div
                    key={circle.id}
                    className="rounded-2xl p-6 flex flex-col gap-4"
                    style={{ background: 'hsl(var(--card))', border: `1px solid ${isMember ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}` }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl" role="img" aria-label={circle.name}>{circle.icon}</span>
                        <div>
                          <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                            {circle.name}
                          </h2>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {circle.membership_type === 'open' ? (
                              <Globe className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                            ) : (
                              <Lock className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                            )}
                            <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {circle.membership_type === 'open' ? 'Open' : 'Invite only'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Users className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{circle.member_count}</span>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {circle.description}
                    </p>

                    <button
                      onClick={() => void handleJoin(circle.id)}
                      disabled={isJoining}
                      className="mt-auto w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                      style={{
                        background: isMember ? 'hsl(var(--muted))' : 'hsl(var(--primary))',
                        color: isMember ? 'hsl(var(--muted-foreground))' : 'hsl(var(--primary-foreground))',
                        border: isMember ? '1px solid hsl(var(--border))' : 'none',
                        opacity: isJoining ? 0.7 : 1,
                      }}
                    >
                      {isJoining ? '...' : isMember ? 'Leave Circle' : 'Join Circle'}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Fallback: show content-layer circles when API not yet available
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pageContent.circles.map((circle, idx) => (
                <motion.div
                  key={circle.id}
                  className="rounded-2xl p-6 flex flex-col gap-4"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl" role="img" aria-label={circle.name}>{circle.icon}</span>
                      <div>
                        <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                          {circle.name}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Globe className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Open</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {circle.description}
                  </p>
                  <button
                    onClick={() => { if (!myId) window.location.href = '/signup'; }}
                    className="mt-auto w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                  >
                    Join Circle
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA */}
          <motion.div
            className="mt-12 text-center p-8 rounded-2xl"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              {pageContent.cta.title}
            </p>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {pageContent.cta.subtitle}
            </p>
          </motion.div>

        </div>
      </main>
    </>
  );
}
