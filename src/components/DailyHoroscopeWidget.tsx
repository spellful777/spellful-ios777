/**
 * DailyHoroscopeWidget — compact Spellful-style horoscope card for the homepage.
 * Shows headline + body excerpt + Do/Don't preview + link to full reading.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import type { DailyHoroscope } from '@/lib/horoscope-engine';
import HoroscopeShareMenu from '@/components/HoroscopeShareMenu';

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

export default function DailyHoroscopeWidget() {
  const [horoscope, setHoroscope] = useState<DailyHoroscope | null>(null);
  const [loading, setLoading] = useState(true);
  const [noBirthDate, setNoBirthDate] = useState(false);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/horoscope/today');
      if (res.status === 400) {
        const data = await res.json() as { error: string };
        if (data.error === 'no_birth_date') { setNoBirthDate(true); return; }
      }
      if (!res.ok) return;
      const data = await res.json() as DailyHoroscope;
      setHoroscope(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch_(); }, [fetch_]);

  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div
        className="rounded-2xl p-8 animate-pulse"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="h-3 w-32 rounded mb-4" style={{ background: 'hsl(var(--muted))' }} />
        <div className="h-8 w-3/4 rounded mb-3" style={{ background: 'hsl(var(--muted))' }} />
        <div className="h-4 w-full rounded mb-2" style={{ background: 'hsl(var(--muted))' }} />
        <div className="h-4 w-5/6 rounded" style={{ background: 'hsl(var(--muted))' }} />
      </div>
    );
  }

  if (noBirthDate) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <p className="text-2xl mb-3">☽</p>
        <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
          Add your birth date to unlock your daily horoscope.
        </p>
        <Link
          to="/account"
          className="text-xs px-4 py-2 rounded-full transition-all"
          style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
        >
          Update Account
        </Link>
      </div>
    );
  }

  if (!horoscope) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' as const }}
      className="rounded-2xl p-8"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      {/* Eyebrow row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p
            className="text-xs uppercase tracking-widest mb-0.5"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', letterSpacing: '0.18em' }}
          >
            Your Day at a Glance
          </p>
          <p
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
          >
            {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'hsl(var(--primary))', fontSize: '1.25rem' }}>
              {/* eslint-disable-next-line security/detect-object-injection */}
              {SIGN_SYMBOLS[horoscope.sign] ?? '✦'}
            </span>
            <span
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontStyle: 'italic' }}
            >
              {horoscope.sign}
            </span>
          </div>
          <HoroscopeShareMenu horoscope={horoscope} />
        </div>
      </div>

      {/* Headline */}
      <h2
        className="text-2xl md:text-3xl leading-tight mb-5"
        style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))', fontWeight: 300, fontStyle: 'italic' }}
      >
        {horoscope.headline}
      </h2>

      {/* Body excerpt */}
      <p
        className="text-sm leading-relaxed mb-6 line-clamp-3"
        style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'hsl(var(--foreground))' }}
      >
        {horoscope.body}
      </p>

      {/* Do / Don't compact */}
      <div
        className="grid grid-cols-2 gap-6 border-t pt-6 mb-6"
        style={{ borderColor: 'hsl(var(--border))' }}
      >
        <div>
          <p
            className="text-xs uppercase mb-3"
            style={{ color: 'hsl(var(--primary) / 0.7)', fontFamily: 'var(--font-sans)', letterSpacing: '0.28em' }}
          >
            Do
          </p>
          <div className="flex flex-col gap-2">
            {horoscope.do.map((item, i) => (
              <p
                key={i}
                className="text-base"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))', fontWeight: 400 }}
              >
                {item}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p
            className="text-xs uppercase mb-3"
            style={{ color: 'hsl(var(--primary) / 0.7)', fontFamily: 'var(--font-sans)', letterSpacing: '0.28em' }}
          >
            Don&apos;t
          </p>
          <div className="flex flex-col gap-2">
              {horoscope.dont.map((item, i) => (
              <p
                key={i}
                className="text-base"
                style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--accent))', fontWeight: 400, fontStyle: 'italic' }}
              >
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Read full */}
      <Link
        to="/horoscope"
        className="text-xs flex items-center gap-1.5 transition-colors"
        style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
      >
        Read your full reading
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
        </svg>
      </Link>
    </motion.div>
  );
}
