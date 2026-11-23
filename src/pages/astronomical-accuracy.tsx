import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ExternalLink, Moon, Calculator, Globe, Clock, BookOpen, Star } from 'lucide-react';
import { ShareBar } from '@/components/ShareBar';
import { astronomical_accuracy } from 'virtual:content';

const siteUrl = 'https://spellful.com';
const pageUrl = `${siteUrl}/astronomical-accuracy`;

const SECTIONS = [
  {
    id: 'calculation-engine',
    icon: Calculator,
    title: 'Our Calculation Engine',
    content: `All lunar calculations on Spellful are performed using the algorithms from Jean Meeus's <em>Astronomical Algorithms</em> (2nd edition), specifically Chapter 47 — the industry-standard reference for high-precision lunar ephemeris calculations. We implement the full perturbation series for phase moments, which achieves accuracy of ±2 minutes for dates between 1900 and 2100.`,
  },
  {
    id: 'moon-phases',
    icon: Moon,
    title: 'How Moon Phases Are Calculated',
    content: `A lunar cycle (synodic month) averages 29.530588861 days. We calculate the exact moment of each principal phase — New Moon, First Quarter, Full Moon, and Last Quarter — using Meeus's JDE (Julian Ephemeris Day) formula with 25+ perturbation correction terms that account for the gravitational influence of the Sun, Venus, Jupiter, and the Moon's own orbital eccentricity. The current phase between principal moments is determined by computing the Moon's elongation (angular separation from the Sun), which gives us the eight named phases: New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Last Quarter, and Waning Crescent.`,
  },
  {
    id: 'timezone',
    icon: Globe,
    title: 'UTC and Timezone Handling',
    content: `All astronomical calculations are performed in Universal Coordinated Time (UTC), which is the international standard for astronomical timekeeping. When we display a lunar event time for your location, we convert from UTC to your local timezone using your browser's timezone settings. This means a Full Moon that occurs at 21:02 UTC will display as 2:02 PM Mountain Time (UTC−7) or 5:02 PM Eastern Time (UTC−4). Daylight Saving Time transitions are handled automatically by your device's timezone database.`,
  },
  {
    id: 'zodiac-placement',
    icon: Clock,
    title: 'Zodiac Sign Placement',
    content: `The zodiac sign of each lunar and solar event is determined by calculating the Moon's or Sun's ecliptic longitude using the full Meeus Chapter 47 perturbation series — 60 longitude terms for the Moon, with Venus and Jupiter additive corrections, achieving ~0.01° accuracy. The ecliptic is divided into 12 equal 30° segments corresponding to the zodiac signs, beginning with Aries at 0°. This is the tropical zodiac system used in Western astrology, and is labeled as such throughout Spellful — zodiac sign placement is an astrological convention, not an astronomical classification.`,
  },
  {
    id: 'supermoon',
    icon: Star,
    title: 'Super Moon and Blue Moon Detection',
    content: `A Super Moon occurs when a Full Moon coincides with the Moon being within approximately 90% of its closest approach to Earth (perigee). We calculate the Earth–Moon distance at each full moon using Meeus's distance formula, which accounts for the Moon's elliptical orbit. A Blue Moon is defined as the second Full Moon in a single calendar month (the "calendar" definition), which we detect by comparing full moon dates within each month.`,
  },
  {
    id: 'birth-chart',
    icon: Star,
    title: 'Birth Chart & Planetary Positions',
    content: 'Birth charts on Spellful are calculated using the VSOP87 (Variations Séculaires des Orbites Planétaires) analytical theory — the same planetary theory used by professional astronomical software. We compute positions for 10 celestial bodies: the Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto, plus the Ascendant (Rising sign) and Midheaven (MC). Planetary longitudes are converted to the tropical zodiac, and house cusps are calculated using the Placidus house system. Aspects between planets are detected using standard orb tolerances (conjunction ±8°, opposition ±8°, trine ±6°, square ±6°, sextile ±4°). All calculations require your birth date, time, and timezone offset.',
  },
  {
    id: 'verification',
    icon: BookOpen,
    title: 'Verification and Sources',
    content: `Our calculations are verified against NASA's Goddard Space Flight Center Moon Phase Calculator and the U.S. Naval Observatory (USNO) moon phase tables. We run automated regression tests covering 2026–2030 to ensure ongoing accuracy. The spiritual interpretations, ritual suggestions, and sacred names associated with each moon are drawn from traditional folk calendars, Wiccan and pagan traditions, and modern spiritual practice — these are cultural and spiritual frameworks, not astronomical data.`,
  },
];

export default function AstronomicalAccuracyPage() {
  return (
    <>
      <Helmet>
        <title>Astronomical Accuracy &amp; Methodology | Spellful</title>
        <meta name="description" content="How Spellful calculates moon phases, lunar events, and zodiac placements — using Meeus astronomical algorithms verified against NASA and the US Naval Observatory." />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content="Astronomical Accuracy & Methodology | Spellful" />
        <meta property="og:description" content="How Spellful calculates moon phases, lunar events, and zodiac placements — using Meeus astronomical algorithms verified against NASA and the US Naval Observatory." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Astronomical Accuracy &amp; Methodology | Spellful" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Astronomical Accuracy &amp; Methodology | Spellful" />
        <meta name="twitter:description" content="How Spellful calculates moon phases, lunar events, and zodiac placements — using Meeus astronomical algorithms verified against NASA and the US Naval Observatory." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Astronomical Accuracy — Spellful" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          '@id': `${pageUrl}#article`,
          name: 'Astronomical Accuracy & Methodology',
          headline: 'How Spellful Calculates Moon Phases',
          url: pageUrl,
          isPartOf: { '@id': `${siteUrl}/#website` },
          description: 'Detailed explanation of the astronomical algorithms used by Spellful for lunar calculations.',
        }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main>
        {/* Hero */}
        <section className="relative pt-16 pb-20 overflow-hidden" style={{ background: 'hsl(var(--background))' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--accent) / 0.10) 0%, transparent 65%)' }} />
          <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 text-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
            >
              {astronomical_accuracy.hero.eyebrow}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl mb-6"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              {astronomical_accuracy.hero.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg leading-relaxed"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
            >
              {astronomical_accuracy.hero.subtitle}
            </motion.p>
          </div>
        </section>

        {/* Accuracy badge bar */}
        <section className="py-8 border-y" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted))' }}>
          <div className="max-w-4xl mx-auto px-6 md:px-10 flex flex-wrap gap-6 justify-center items-center text-sm" style={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--muted-foreground))' }}>
            {[
              'Meeus Astronomical Algorithms Ch. 47',
              'Verified against NASA GSFC',
              'Verified against US Naval Observatory',
              '±2 minute accuracy 1900–2100',
              'Automated regression tests 2026–2030',
            ].map((badge) => (
              <span key={badge} className="flex items-center gap-2">
                <span style={{ color: 'hsl(var(--primary))' }}>✓</span>
                {badge}
              </span>
            ))}
          </div>
        </section>

        {/* Main content sections */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-6 md:px-10 space-y-8">
            {SECTIONS.map((section, i) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  id={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="rounded-2xl p-8 scroll-mt-24"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--primary) / 0.15)' }}>
                      <Icon size={20} style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                    <h2 className="text-xl" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                      {section.title}
                    </h2>
                  </div>
                  <p
                    className="leading-relaxed"
                    style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* External verification links */}
        <section className="py-16" style={{ background: 'hsl(var(--muted))' }}>
          <div className="max-w-3xl mx-auto px-6 md:px-10">
            <h2 className="text-2xl mb-8 text-center" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              Verify Our Calculations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'NASA Moon Phase Calculator', description: 'NASA Goddard Space Flight Center lunar phase data', url: 'https://moon.nasa.gov/moon-in-motion/phases-eclipses-supermoons/moon-phases/' },
                { name: 'US Naval Observatory', description: 'USNO authoritative moon phase tables', url: 'https://aa.usno.navy.mil/data/MoonPhases' },
                { name: 'Time and Date', description: 'Independent moon phase verification tool', url: 'https://www.timeanddate.com/moon/phases/' },
                { name: 'Astronomical Algorithms (Meeus)', description: 'The reference text we implement', url: 'https://www.willbell.com/math/mc1.htm' },
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 rounded-xl transition-colors"
                  style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                >
                  <ExternalLink size={16} className="mt-1 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                  <div>
                    <div className="font-medium text-sm mb-1" style={{ color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)' }}>{link.name}</div>
                    <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{link.description}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Astronomical vs spiritual */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-6 md:px-10">
            <div className="rounded-2xl p-8" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
              <h2 className="text-2xl mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                Astronomical Data vs. Spiritual Interpretation
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                Spellful clearly distinguishes between two types of information:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                  <div className="font-semibold mb-2 text-sm" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>Astronomical Facts</div>
                  <ul className="text-sm space-y-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    <li>• Exact phase moment (UTC)</li>
                    <li>• Moon's zodiac sign placement</li>
                    <li>• Illumination percentage</li>
                    <li>• Earth–Moon distance</li>
                    <li>• Super Moon / Blue Moon status</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--accent) / 0.08)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
                  <div className="font-semibold mb-2 text-sm" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-sans)' }}>Spiritual Interpretation</div>
                  <ul className="text-sm space-y-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                    <li>• Sacred moon names (Harvest Moon, etc.)</li>
                    <li>• Ritual suggestions and intentions</li>
                    <li>• Crystal and herb correspondences</li>
                    <li>• Spellwork themes</li>
                    <li>• Astrological interpretations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Share */}
        <section className="py-8 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-3xl mx-auto px-6 md:px-10 flex justify-center">
            <ShareBar
              text="🔭 How Spellful calculates moon phases — Meeus Ch. 47, ±2 min accuracy, verified against NASA & USNO. Free witchcraft resources."
              url={pageUrl}
              label="Share this page"
            />
          </div>
        </section>

        {/* Nav links */}
        <section className="py-12 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="max-w-3xl mx-auto px-6 md:px-10 flex flex-wrap gap-4 justify-center">
            <Link to="/moon-calendar" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)' }}>
              Moon Calendar
            </Link>
            <Link to="/moon-ritual" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
              Moon Rituals
            </Link>
            <Link to="/moon/phases" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
              Moon Phase Guide
            </Link>
            <Link to="/birth-chart" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
              Birth Chart
            </Link>
            <Link to="/horoscope" className="px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', fontFamily: 'var(--font-sans)' }}>
              Daily Horoscope
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
