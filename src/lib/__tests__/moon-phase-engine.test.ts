/**
 * moon-phase-engine.test.ts
 *
 * Verifies lunar calculations against authoritative sources:
 *  - NASA GSFC Moon Phase Calculator
 *  - US Naval Observatory (USNO) moon phase tables
 *  - Time and Date AS
 *
 * All times are UTC. Tolerance: ±30 minutes for phase moments.
 *
 * 2026 full moon dates (USNO):
 *  Jan 3, Feb 1, Mar 3, Apr 2, May 1, May 31 (Blue Moon),
 *  Jun 29, Jul 29, Aug 28, Sep 26, Oct 26, Nov 24, Dec 24
 */

import { describe, it, expect } from 'vitest';
import { getMoonPhase, generateFullMoonMoments, dateToJD, jdToDate } from '../moon-phase-engine';

// ── Helpers ───────────────────────────────────────────────────────────────────

function utc(iso: string): Date { return new Date(iso); }
function diffMin(a: Date, b: Date): number { return Math.abs(a.getTime() - b.getTime()) / 60000; }

const TOLERANCE_MIN = 30;

// ── JD ↔ Date round-trip ──────────────────────────────────────────────────────

describe('dateToJD / jdToDate round-trip', () => {
  it('J2000.0 epoch', () => {
    expect(dateToJD(utc('2000-01-01T12:00:00Z'))).toBeCloseTo(2451545.0, 4);
  });

  it('round-trip preserves date to within 1 second', () => {
    const d = utc('2026-11-24T15:00:00Z');
    expect(diffMin(d, jdToDate(dateToJD(d)))).toBeLessThan(1 / 60);
  });
});

// ── getMoonPhase — phase name accuracy ───────────────────────────────────────

describe('getMoonPhase — phase names', () => {
  // Dates chosen at the peak of each phase (well inside the elongation band).
  // 2026 new moons (USNO): Jan 18, Feb 17, Mar 18, Apr 17, May 16, Jun 15,
  //   Jul 14, Aug 13, Sep 11, Oct 10, Nov 9, Dec 9
  // 2026 full moons (USNO): Jan 3, Feb 1, Mar 3, Apr 2, May 1, May 31,
  //   Jun 30, Jul 29, Aug 28, Sep 26, Oct 26, Nov 24, Dec 24
  const cases: Array<{ label: string; date: string; expected: string }> = [
    // New Moons (elongation ~0°)
    { label: 'New Moon 2026-01-18',        date: '2026-01-18T20:00:00Z', expected: 'New Moon' },
    { label: 'New Moon 2026-11-09',        date: '2026-11-09T00:00:00Z', expected: 'New Moon' },
    // Full Moons (elongation ~180°)
    { label: 'Full Moon 2026-02-01',       date: '2026-02-01T22:00:00Z', expected: 'Full Moon' },
    { label: 'Full Moon 2026-11-24',       date: '2026-11-24T15:00:00Z', expected: 'Full Moon' },
    { label: 'Full Moon 2027-01-22',       date: '2027-01-22T12:00:00Z', expected: 'Full Moon' },
    { label: 'Full Moon 2028-01-12',       date: '2028-01-12T04:00:00Z', expected: 'Full Moon' },
    { label: 'Full Moon 2030-05-17',       date: '2030-05-17T11:00:00Z', expected: 'Full Moon' },
    // Waxing Crescent: ~22.5–67.5° (between new moon Jan 18 and full moon Feb 1)
    { label: 'Waxing Crescent 2026-01-22', date: '2026-01-22T12:00:00Z', expected: 'Waxing Crescent' },
    // Waxing Gibbous: ~112.5–157.5° (between first quarter and full moon)
    { label: 'Waxing Gibbous 2026-01-28',  date: '2026-01-28T12:00:00Z', expected: 'Waxing Gibbous' },
    // Waning Gibbous: ~202.5–247.5° (just after full moon Jan 3)
    { label: 'Waning Gibbous 2026-01-06',  date: '2026-01-06T12:00:00Z', expected: 'Waning Gibbous' },
    // Waning Crescent: ~292.5–337.5° (between last quarter and new moon)
    { label: 'Waning Crescent 2026-01-15', date: '2026-01-15T12:00:00Z', expected: 'Waning Crescent' },
  ];

  for (const { label, date, expected } of cases) {
    it(label, () => {
      expect(getMoonPhase(utc(date)).phase).toBe(expected);
    });
  }
});

// ── getMoonPhase — illumination sanity ───────────────────────────────────────

describe('getMoonPhase — illumination', () => {
  it('New Moon illumination is near 0%', () => {
    // Jan 18 is the new moon — elongation ~0°
    expect(getMoonPhase(utc('2026-01-18T20:00:00Z')).illumination).toBeLessThan(5);
  });

  it('Full Moon illumination is near 100%', () => {
    // Feb 1 is the full moon — elongation ~180°
    expect(getMoonPhase(utc('2026-02-01T22:00:00Z')).illumination).toBeGreaterThan(95);
  });

  it('Quarter illumination is near 50%', () => {
    // ~7 days after new moon Jan 18 → Jan 25 should be near first quarter
    const result = getMoonPhase(utc('2026-01-25T12:00:00Z'));
    expect(result.illumination).toBeGreaterThan(35);
    expect(result.illumination).toBeLessThan(65);
  });
});

// ── generateFullMoonMoments — date accuracy ───────────────────────────────────

describe('generateFullMoonMoments — date accuracy', () => {
  // Known full moon UTC times from USNO (verified)
  const knownFullMoons: Array<{ label: string; iso: string; utcApprox: string }> = [
    { label: 'Jan 2026',  iso: '2026-01-03', utcApprox: '2026-01-03T10:04:00Z' },
    { label: 'Feb 2026',  iso: '2026-02-01', utcApprox: '2026-02-01T22:11:00Z' },
    { label: 'Mar 2026',  iso: '2026-03-03', utcApprox: '2026-03-03T11:40:00Z' },
    { label: 'Apr 2026',  iso: '2026-04-02', utcApprox: '2026-04-02T02:14:00Z' },
    { label: 'May 2026',  iso: '2026-05-01', utcApprox: '2026-05-01T17:25:00Z' },
    { label: 'May 2026 Blue Moon', iso: '2026-05-31', utcApprox: '2026-05-31T08:47:00Z' },
    { label: 'Jun 2026',  iso: '2026-06-29', utcApprox: '2026-06-29T23:58:00Z' },
    { label: 'Jul 2026',  iso: '2026-07-29', utcApprox: '2026-07-29T14:37:00Z' },
    { label: 'Aug 2026',  iso: '2026-08-28', utcApprox: '2026-08-28T04:19:00Z' },
    { label: 'Sep 2026',  iso: '2026-09-26', utcApprox: '2026-09-26T16:50:00Z' },
    { label: 'Oct 2026',  iso: '2026-10-26', utcApprox: '2026-10-26T04:13:00Z' },
    { label: 'Nov 2026',  iso: '2026-11-24', utcApprox: '2026-11-24T14:54:00Z' },
    { label: 'Dec 2026',  iso: '2026-12-24', utcApprox: '2026-12-24T01:29:00Z' },
    // 2027
    { label: 'Jan 2027',  iso: '2027-01-22', utcApprox: '2027-01-22T12:18:00Z' },
    { label: 'Feb 2027',  iso: '2027-02-20', utcApprox: '2027-02-20T23:25:00Z' },
    // 2028
    { label: 'Jan 2028',  iso: '2028-01-12', utcApprox: '2028-01-12T04:04:00Z' },
    { label: 'Feb 2028',  iso: '2028-02-10', utcApprox: '2028-02-10T15:05:00Z' },
    // 2029
    { label: 'Jan 2029',  iso: '2029-01-30', utcApprox: '2029-01-30T06:04:00Z' },
    // 2030
    { label: 'May 2030',  iso: '2030-05-17', utcApprox: '2030-05-17T11:20:00Z' },
    { label: 'Jun 2030',  iso: '2030-06-15', utcApprox: '2030-06-15T18:42:00Z' },
  ];

  const moments = generateFullMoonMoments(2026, 2030);
  const byIso = new Map(moments.map(m => [m.iso, m]));

  for (const { label, iso, utcApprox } of knownFullMoons) {
    it(`${label} (${iso}) within ${TOLERANCE_MIN} min`, () => {
      const m = byIso.get(iso);
      expect(m, `No full moon found for ${iso}`).toBeDefined();
      if (!m) return;
      expect(diffMin(m.date, utc(utcApprox))).toBeLessThan(TOLERANCE_MIN);
    });
  }

  it('generates 13 full moons for 2026 (Blue Moon year)', () => {
    expect(moments.filter(m => m.year === 2026).length).toBe(13);
  });

  it('day-of-week is correct for 2026-01-03 (Saturday = 6)', () => {
    expect(byIso.get('2026-01-03')?.dow).toBe(6);
  });

  it('day-of-week is correct for 2026-02-01 (Sunday = 0)', () => {
    expect(byIso.get('2026-02-01')?.dow).toBe(0);
  });

  it('Nov 2026 full moon is not a super moon (dist > 360,000 km)', () => {
    const m = byIso.get('2026-11-24');
    expect(m?.distanceKm).toBeGreaterThan(360000);
  });

  it('Feb 2028 full moon is a super moon (dist ≤ 360,000 km)', () => {
    // Feb 10, 2028 is a known super moon (perigee full moon)
    const m = byIso.get('2028-02-10');
    expect(m?.distanceKm).toBeLessThanOrEqual(360000);
  });
});

// ── No hardcoded dates ────────────────────────────────────────────────────────

describe('no hardcoded phase dates', () => {
  it('getMoonPhase works for a date far in the future (2035)', () => {
    const result = getMoonPhase(utc('2035-06-15T12:00:00Z'));
    expect(['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
            'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'])
      .toContain(result.phase);
    expect(result.illumination).toBeGreaterThanOrEqual(0);
    expect(result.illumination).toBeLessThanOrEqual(100);
  });

  it('getMoonPhase works for a historical date (1990)', () => {
    const result = getMoonPhase(utc('1990-07-22T12:00:00Z'));
    expect(result.age).toBeGreaterThanOrEqual(0);
    expect(result.age).toBeLessThan(30);
  });

  it('age is always within one synodic period', () => {
    const dates = [
      '2026-03-15T00:00:00Z', '2027-08-01T12:00:00Z',
      '2028-12-31T23:59:00Z', '2030-01-01T00:00:00Z',
    ];
    for (const d of dates) {
      const { age } = getMoonPhase(utc(d));
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThan(29.531);
    }
  });
});
