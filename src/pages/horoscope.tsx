import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import MoonNightSky from '@/components/MoonNightSky';
import TwinkleStars from '@/components/TwinkleStars';
import { useSession } from '@/lib/auth/auth-client';
import type { DailyHoroscope } from '@/lib/horoscope-engine';
import { horoscope as hc } from 'virtual:content';

// ── Share button ──────────────────────────────────────────────────────────────
function SharePanel({ horoscope }: { horoscope: DailyHoroscope }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = 'https://spellful.com/horoscope';
  const text = `${horoscope.sign} · ${horoscope.headline}\n\n${horoscope.body.slice(0, 120)}…\n\nRead yours at spellful.com`;

  const shareX = () => window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
  const shareBluesky = () => window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-full transition-all duration-200"
        style={{
          background: open ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
          color: 'hsl(var(--primary))',
          border: '1px solid hsl(var(--primary) / 0.3)',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.06em',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 rounded-2xl overflow-hidden z-20 min-w-[180px]"
            style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', boxShadow: '0 8px 32px hsl(var(--background) / 0.8)' }}
          >
            {[
              { label: 'Post on X', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              ), action: shareX },
              { label: 'Share on Facebook', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              ), action: shareFacebook },
              { label: 'Post on Bluesky', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.299-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg>
              ), action: shareBluesky },
              { label: copied ? 'Copied!' : 'Copy link', icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              ), action: copyLink },
            ].map(({ label, icon, action }) => (
              <button
                key={label}
                onClick={() => { void action(); if (label !== 'Copy link' && label !== 'Copied!') setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left"
                style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>{icon}</span>
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sign symbol map ───────────────────────────────────────────────────────────
const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HoroscopePage() {
  const { session, isPending } = useSession();
  const [horoscope, setHoroscope] = useState<DailyHoroscope | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [horoscopeSaved, setHoroscopeSaved] = useState(false);
  const [horoscopeSaving, setHoroscopeSaving] = useState(false);

  const handleSaveHoroscope = useCallback(async () => {
    if (!horoscope || !session) return;
    setHoroscopeSaving(true);
    try {
      const res = await fetch('/api/grimoire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'journal',
          title: `${horoscope.sign} Horoscope — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
          content: `${horoscope.headline}\n\n${horoscope.body}\n\n${horoscope.planetNote}`,
          notes: [
            horoscope.moonContext ? `Moon: ${horoscope.moonContext}` : '',
            horoscope.risingContext ? `Rising: ${horoscope.risingContext}` : '',
            horoscope.do.length ? `Do: ${horoscope.do.join(', ')}` : '',
            horoscope.dont.length ? `Don't: ${horoscope.dont.join(', ')}` : '',
          ].filter(Boolean).join('\n'),
          tags: `horoscope,${horoscope.sign.toLowerCase()}`,
          entryDate: new Date().toISOString().split('T')[0],
          metadata: { sign: horoscope.sign, source: 'horoscope' },
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setHoroscopeSaved(true);
    } catch {
      // silently fail — button stays enabled so user can retry
    } finally {
      setHoroscopeSaving(false);
    }
  }, [horoscope, session]);

  const fetchHoroscope = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/horoscope/today');
      if (res.status === 400) {
        const data = await res.json() as { error: string };
        if (data.error === 'no_birth_date') {
          setError('birth_date');
          return;
        }
      }
      if (!res.ok) throw new Error('Failed to load horoscope');
      const data = await res.json() as DailyHoroscope;
      setHoroscope(data);
    } catch {
      setError('failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) void fetchHoroscope();
  }, [session, fetchHoroscope]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <Helmet>
        <title>Your Daily Horoscope — Spellful</title>
        <meta name="description" content="Your personalized daily horoscope on Spellful. A mystical reading based on your birth chart — headline, body, planet note, and Do/Don't guidance." />
        <meta name="robots" content="noindex" />
        <meta property="og:title" content="Your Daily Horoscope — Spellful" />
        <meta property="og:description" content="Get your personalized daily horoscope on Spellful — free astrology readings based on your birth chart." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/horoscope" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Your Daily Horoscope — Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Daily Horoscope — Spellful" />
        <meta name="twitter:description" content="Get your personalized daily horoscope on Spellful — free astrology readings based on your birth chart." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Your Daily Horoscope — Spellful" />
      </Helmet>

      <main className="relative min-h-screen pt-8 pb-32 px-6 overflow-hidden">
        <MoonNightSky moonPosition="top-right" moonSize={72} opacity={0.55} shootingStars={true} />
        <TwinkleStars count={34} opacity={0.45} />
        <div className="relative z-10 max-w-xl mx-auto">

          {/* ── Loading ── */}
          {(isPending || loading) && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-sans)' }}>{hc.loadingText}</p>
            </div>
          )}

          {/* ── Not signed in ── */}
          {!isPending && !session && (
            <div className="text-center py-32">
              <p className="text-4xl mb-6">✦</p>
              <h1 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>Your Daily Reading</h1>
              <p className="text-muted-foreground mb-8" style={{ fontFamily: 'var(--font-sans)' }}>{hc.signInPrompt}</p>
              <Link
                to="/login"
                className="inline-block px-8 py-3 rounded-full text-sm font-medium transition-all"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                {hc.signInButton}
              </Link>
            </div>
          )}

          {/* ── No birth date ── */}
          {!loading && error === 'birth_date' && (
            <div className="text-center py-32">
              <p className="text-4xl mb-6">☽</p>
              <h1 className="text-3xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{hc.noBirthDateHeading}</h1>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto" style={{ fontFamily: 'var(--font-sans)' }}>
                {hc.noBirthDateBody}
              </p>
              <Link
                to="/account"
                className="inline-block px-8 py-3 rounded-full text-sm font-medium transition-all"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}
              >
                {hc.noBirthDateButton}
              </Link>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error === 'failed' && (
            <div className="text-center py-32">
              <p className="text-muted-foreground mb-4" style={{ fontFamily: 'var(--font-sans)' }}>Could not load your horoscope.</p>
              <button
                onClick={() => void fetchHoroscope()}
                className="text-sm px-6 py-2 rounded-full"
                style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}
              >
                Try again
              </button>
            </div>
          )}

          {/* ── Reading ── */}
          {!loading && horoscope && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' as const }}
            >
              {/* Eyebrow */}
              <div className="flex items-center justify-between mb-14">
                <div className="flex flex-col gap-1">
                  <p
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.65rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {hc.eyebrow}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.95rem',
                      fontStyle: 'italic',
                      color: 'hsl(var(--muted-foreground))',
                    }}
                  >
                    {dateLabel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: 'hsl(var(--primary))', fontSize: '1.6rem', lineHeight: 1, filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.4))' }}>
                    {/* eslint-disable-next-line security/detect-object-injection */}
                    {SIGN_SYMBOLS[horoscope.sign] ?? '✦'}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1rem',
                      fontStyle: 'italic',
                      letterSpacing: '0.04em',
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    {horoscope.sign}
                  </span>
                </div>
              </div>

              {/* Headline — Spellful large serif */}
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(2.6rem, 7vw, 4.5rem)',
                  lineHeight: 1.08,
                  fontWeight: 300,
                  color: 'hsl(var(--foreground))',
                  marginBottom: '2.5rem',
                  letterSpacing: '0.01em',
                  fontStyle: 'italic',
                }}
              >
                {horoscope.headline}
              </h1>

              {/* Body */}
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                  lineHeight: 1.75,
                  fontWeight: 400,
                  color: 'hsl(var(--foreground))',
                  marginBottom: '2rem',
                }}
              >
                {horoscope.body}
              </p>

              {/* Planet note */}
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'hsl(var(--accent))',
                  marginBottom: '3.5rem',
                  paddingLeft: '1.25rem',
                  borderLeft: '1px solid hsl(var(--primary) / 0.5)',
                }}
              >
                {horoscope.planetNote}
              </p>

              {/* Moon & Rising context — only shown when the user has these stored */}
              {(horoscope.moonContext || horoscope.risingContext) && (
                <div
                  style={{
                    borderTop: '1px solid hsl(var(--border))',
                    paddingTop: '2rem',
                    marginBottom: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  {horoscope.moonContext && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ color: 'hsl(var(--accent))', fontSize: '1rem', lineHeight: 1.7, flexShrink: 0 }}>☽</span>
                      <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', lineHeight: 1.7, fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>
                        {horoscope.moonContext}
                      </p>
                    </div>
                  )}
                  {horoscope.risingContext && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ color: 'hsl(var(--accent))', fontSize: '1rem', lineHeight: 1.7, flexShrink: 0 }}>↑</span>
                      <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', lineHeight: 1.7, fontStyle: 'italic', color: 'hsl(var(--muted-foreground))' }}>
                        {horoscope.risingContext}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* How We Calculate This */}
              <div style={{ marginBottom: '2rem', textAlign: 'right' }}>
                <a
                  href="/astronomical-accuracy#zodiac-placement"
                  className="text-xs underline opacity-50 hover:opacity-90 transition-opacity"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  How we calculate this →
                </a>
              </div>

              {/* Do / Don't — Spellful two-column */}
              <div
                style={{
                  borderTop: '1px solid hsl(var(--border))',
                  paddingTop: '2.5rem',
                  marginBottom: '3rem',
                }}
              >
                <div className="grid grid-cols-2 gap-10">
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.28em',
                        textTransform: 'uppercase',
                        color: 'hsl(var(--primary) / 0.7)',
                        marginBottom: '1.5rem',
                      }}
                    >
                      {hc.doLabel}
                    </p>
                    <div className="flex flex-col gap-4">
                      {horoscope.do.map((item, i) => (
                        <p
                          key={i}
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                            lineHeight: 1.2,
                            fontWeight: 400,
                            color: 'hsl(var(--foreground))',
                          }}
                        >
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.28em',
                        textTransform: 'uppercase',
                        color: 'hsl(var(--primary) / 0.7)',
                        marginBottom: '1.5rem',
                      }}
                    >
                      {hc.dontLabel}
                    </p>
                    <div className="flex flex-col gap-4">
                      {horoscope.dont.map((item, i) => (
                        <p
                          key={i}
                          style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                            lineHeight: 1.2,
                            fontWeight: 400,
                            fontStyle: 'italic',
                            color: 'hsl(var(--accent))',
                          }}
                        >
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Share + Save to Grimoire */}
              <div
                style={{
                  borderTop: '1px solid hsl(var(--border))',
                  paddingTop: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <p
                  className="text-xs"
                  style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                >
                  {hc.dateUpdatesNote}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {session && (
                    <button
                      onClick={() => void handleSaveHoroscope()}
                      disabled={horoscopeSaving || horoscopeSaved}
                      className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-full transition-all duration-200 disabled:opacity-60"
                      style={{
                        background: horoscopeSaved ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--muted))',
                        color: horoscopeSaved ? 'hsl(var(--success))' : 'hsl(var(--primary))',
                        border: horoscopeSaved ? '1px solid hsl(var(--success) / 0.4)' : '1px solid hsl(var(--primary) / 0.3)',
                        fontFamily: 'var(--font-sans)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {horoscopeSaved ? '✓ Saved to Grimoire' : horoscopeSaving ? 'Saving…' : '📖 Save to Grimoire'}
                    </button>
                  )}
                  <SharePanel horoscope={horoscope} />
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </>
  );
}
