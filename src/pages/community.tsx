import { Helmet } from '@dr.pogodin/react-helmet';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Star, Clock, Users, Wand2 } from 'lucide-react';
import { Link } from 'react-router';
import { community_landing } from 'virtual:content';

interface CommunityStats {
  onlineCount: number;
  registeredCount: number;
}

function CommunityStatsStrip() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/community/stats');
        if (!res.ok) throw new Error('failed');
        const data: CommunityStats = await res.json();
        if (!cancelled) { setStats(data); setError(false); }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    // Refresh every 60 seconds so the online count stays current without a page reload
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <div
      className="border-b"
      style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      aria-label="Community statistics"
    >
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">

        {/* Witches Online */}
        <div className="flex items-center gap-2.5">
          {/* Animated live dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: 'hsl(var(--presence-live))' }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: 'hsl(var(--presence-live))' }}
            />
          </span>
          {stats === null && !error ? (
            <span className="h-4 w-28 rounded animate-pulse inline-block" style={{ background: 'hsl(var(--muted))' }} aria-label="Loading online count" />
          ) : error ? (
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>— Witches Online</span>
          ) : (
            <span style={{ fontFamily: 'var(--font-sans)' }}>
              <span className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                {stats!.onlineCount.toLocaleString()}
              </span>
              <span className="text-sm ml-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Witches Online</span>
            </span>
          )}
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded"
            style={{ background: 'hsl(var(--presence-live-bg) / 0.15)', color: 'hsl(var(--presence-live))', fontFamily: 'var(--font-sans)' }}
          >
            Live
          </span>
        </div>

        {/* Divider */}
        <span className="hidden sm:block w-px h-5 shrink-0" style={{ background: 'hsl(var(--border))' }} aria-hidden="true" />

        {/* Registered Witches */}
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--accent))' }} aria-hidden="true" />
          {stats === null && !error ? (
            <span className="h-4 w-36 rounded animate-pulse inline-block" style={{ background: 'hsl(var(--muted))' }} aria-label="Loading registered count" />
          ) : error ? (
            <span className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>— Registered Witches</span>
          ) : (
            <span style={{ fontFamily: 'var(--font-sans)' }}>
              <span className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                {stats!.registeredCount.toLocaleString()}
              </span>
              <span className="text-sm ml-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>Registered Witches</span>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

export default function CommunityPage() {
  const siteUrl = 'https://spellful.com';
  const pageUrl = `${siteUrl}/community`;

  return (
    <>
      <Helmet>
        <title>The Coven — Join Our Community | Spellful</title>
        <meta name="description" content="A sacred circle of witches, seekers, and dreamers. Join the Spellful coven for live rituals, guided workshops, and a community that walks the path with you." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="The Coven — Join Our Community | Spellful" />
        <meta property="og:description" content="A sacred circle of witches, seekers, and dreamers. Join the Spellful coven for live rituals, guided workshops, and a community that walks the path with you." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={`${siteUrl}/airo-assets/images/pages/community/hero`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${siteUrl}/airo-assets/images/pages/community/hero`} />
        <script type="application/ld+json">{`{"@context":"https://schema.org","@type":"WebPage","@id":"${pageUrl}#webpage","name":"The Coven — Spellful Community","url":"${pageUrl}","isPartOf":{"@id":"${siteUrl}/#website"}}`}</script>
      </Helmet>

      <main>
        {/* HERO */}
        <section className="relative min-h-[65vh] flex items-end overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/airo-assets/images/pages/community/hero"
              alt=""
              className="w-full h-full object-cover"
              style={{ opacity: 0.45 }}
              loading="eager"
              fetchPriority="high"
              width={1920}
              height={900}
            />
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, hsl(var(--background) / 0.3) 0%, hsl(var(--background) / 0.5) 50%, hsl(var(--background) / 1) 100%)' }} />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 pb-20 pt-44 text-center w-full">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
            >
              {community_landing.hero.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {community_landing.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {community_landing.hero.subtitle}
            </motion.p>
          </div>
        </section>

        <CommunityStatsStrip />

        {/* UPCOMING GATHERINGS */}
        <section className="py-xxl" style={{ background: 'hsl(var(--card))', borderTop: '1px solid hsl(var(--border))', borderBottom: '1px solid hsl(var(--border))' }}>
          <div className="max-w-4xl mx-auto px-6 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>Mark Your Calendar</p>
              <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Upcoming Gatherings</h2>
            </motion.div>
            <div className="space-y-4">
              {community_landing.gatherings.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 rounded-xl"
                  style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                >
                  <div className="shrink-0 text-center sm:text-left sm:w-32">
                    <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>{event.type}</p>
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{event.date}</p>
                  </div>
                  <div className="w-px h-12 hidden sm:block shrink-0" style={{ background: 'hsl(var(--border))' }} />
                  <div className="flex-1">
                    <h3 className="text-xl mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{event.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{event.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    <Clock className="w-4 h-4" />
                    <span className="text-sm" style={{ fontFamily: 'var(--font-sans)' }}>{event.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-xxl" style={{ background: 'hsl(var(--background))' }}>
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>From the Coven</p>
              <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Voices of the Circle</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
              {community_landing.testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-8 rounded-xl"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <div className="flex gap-1 mb-4">
                    {[0,1,2,3,4].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-current" style={{ color: 'hsl(var(--primary))' }} />
                    ))}
                  </div>
                  <p className="text-base leading-relaxed mb-6 italic" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
                    "{t.quote}"
                  </p>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CREATOR CTA */}
        <section className="py-xl" style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <div className="max-w-2xl mx-auto px-6 md:px-10 text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                <Wand2 className="w-6 h-6" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <h2 className="text-2xl md:text-3xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                Share your magical work
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Are you a tarot reader, herbalist, astrologer, or magical artist? Apply for Creator status and get a Verified Creator badge on your profile.
              </p>
              <Link to="/creator-application"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all hover:opacity-90"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                <Wand2 className="w-4 h-4" />
                Apply to Become a Creator
              </Link>
            </motion.div>
          </div>
        </section>

      </main>
    </>
  );
}
