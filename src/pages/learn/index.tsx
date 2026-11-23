import { useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { BookOpen, Star, Lock, ChevronRight, Search, Sparkles, GraduationCap } from 'lucide-react';
import { authClient } from '@/lib/auth/auth-client';
import { ACADEMY_TOPICS } from '@/lib/academy-data';
import { useAcademy } from '@/hooks/useAcademy';

export default function LearnPage() {
  const { data: sessionData, isPending } = authClient.useSession();
  const isSignedIn = !!sessionData?.session;
  const { topicProgress, loading } = useAcademy();
  const [search, setSearch] = useState('');

  const filtered = ACADEMY_TOPICS.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

  const totalLessons = ACADEMY_TOPICS.reduce((s, t) => s + t.lessons.length, 0);

  return (
    <>
      <Helmet>
        <title>Spellful Academy — Free Lessons in Astrology, Tarot, Witchcraft & More</title>
        <meta name="description" content="Spellful Academy offers 22 free guided lessons across 9 topics: astrology, tarot, moon phases, numerology, witchcraft, herbs & crystals, dreams, and history. Interactive quizzes, glossaries, and progress tracking for registered members." />
        <meta property="og:title" content="Spellful Academy — Free Lessons in Astrology, Tarot & Witchcraft" />
        <meta property="og:description" content="22 free guided lessons across 9 topics. Learn astrology, tarot, moon magic, numerology, witchcraft, herbs, dreams, and history with quizzes and progress tracking." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://spellful.com/learn" />
        <meta property="og:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Spellful Academy — Free Lessons in Astrology, Tarot &amp; Witchcraft" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Spellful Academy — Free Lessons in Astrology, Tarot &amp; Witchcraft" />
        <meta name="twitter:description" content="22 free guided lessons across 9 topics. Learn astrology, tarot, moon magic, numerology, witchcraft, herbs, dreams, and history." />
        <meta name="twitter:image" content="https://spellful.com/airo-assets/uploads/pages-og-image-7ff4c824.png" />
        <meta name="twitter:image:alt" content="Spellful Academy — Free Lessons in Astrology, Tarot &amp; Witchcraft" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "@id": "https://spellful.com/learn#academy",
          "name": "Spellful Academy",
          "url": "https://spellful.com/learn",
          "description": "Free guided lessons in astrology, tarot, moon phases, numerology, witchcraft, herbs & crystals, dreams, and history for modern spiritual seekers.",
          "provider": { "@id": "https://spellful.com/#organization" },
          "isPartOf": { "@id": "https://spellful.com/#website" },
          "hasCourse": [
            { "@type": "Course", "name": "Astrology", "url": "https://spellful.com/learn/astrology" },
            { "@type": "Course", "name": "Tarot", "url": "https://spellful.com/learn/tarot" },
            { "@type": "Course", "name": "Moon Phases", "url": "https://spellful.com/learn/moon-phases" },
            { "@type": "Course", "name": "Numerology", "url": "https://spellful.com/learn/numerology" },
            { "@type": "Course", "name": "Witchcraft", "url": "https://spellful.com/learn/witchcraft" },
            { "@type": "Course", "name": "Herbs & Crystals", "url": "https://spellful.com/learn/herbs-crystals" },
            { "@type": "Course", "name": "Dreams", "url": "https://spellful.com/learn/dreams" },
            { "@type": "Course", "name": "History & Origins", "url": "https://spellful.com/learn/history-origins" },
          ],
        }).replace(/</g, "\u003c")}</script>
      </Helmet>

      <main>
        {/* Hero */}
        <section
          className="relative py-xxxl text-center"
          style={{ background: 'linear-gradient(180deg, hsl(var(--card-deep)) 0%, hsl(var(--background)) 100%)' }}
        >
          <div className="max-w-content mx-auto px-5 sm:px-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-sm tracking-wide uppercase" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                Spellful Academy
              </span>
            </div>
            <h1
              className="text-5xl md:text-6xl mb-4"
              style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
            >
              The Learning Sanctuary
            </h1>
            <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
              Guided lessons in astrology, tarot, lunar magic, numerology, witchcraft, herbs, dreams, and history.
              Beginner-friendly, historically grounded, and always free for registered members.
            </p>

            {!isPending && !isSignedIn && (
              <div
                className="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-4 rounded-2xl mb-8"
                style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              >
                <Lock className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                <span style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', fontSize: '0.9rem' }}>
                  Create a free account to access all lessons, quizzes, and progress tracking.
                </span>
                <div className="flex gap-2">
                  <Link
                    to="/signup"
                    className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
                  >
                    Create Free Account
                  </Link>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}

            {isSignedIn && !loading && (
              <div className="flex items-center justify-center gap-6 mb-8 flex-wrap">
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-heading)' }}>
                    {totalLessons}
                  </div>
                  <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Total Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: 'hsl(var(--accent))', fontFamily: 'var(--font-heading)' }}>
                    {ACADEMY_TOPICS.length}
                  </div>
                  <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Topics</div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <input
                type="text"
                placeholder="Search topics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-full text-sm"
                style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </section>

        {/* Topic Grid */}
        <section className="py-xxl">
          <div className="max-w-content mx-auto px-5 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base">
              {filtered.map((topic) => {
                const pct = isSignedIn ? topicProgress(topic.slug, topic.lessons.length) : 0;
                return (
                  <Link
                    key={topic.slug}
                    to={isSignedIn ? `/learn/${topic.slug}` : '/signup'}
                    className="group block rounded-2xl p-6 transition-all hover:scale-[1.02]"
                    style={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      textDecoration: 'none',
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: 'hsl(var(--muted))' }}
                      >
                        {topic.icon}
                      </div>
                      {!isSignedIn && (
                        <Lock className="w-4 h-4 mt-1" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      )}
                      {isSignedIn && pct === 100 && (
                        <Star className="w-4 h-4 mt-1" style={{ color: 'hsl(var(--primary))' }} />
                      )}
                    </div>

                    <h2
                      className="text-xl mb-1"
                      style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}
                    >
                      {topic.title}
                    </h2>
                    <p
                      className="text-sm mb-1"
                      style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}
                    >
                      {topic.subtitle}
                    </p>
                    <p
                      className="text-sm mb-4 line-clamp-2"
                      style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}
                    >
                      {topic.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {topic.lessons.length} {topic.lessons.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: 'hsl(var(--primary))' }} />
                    </div>

                    {isSignedIn && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                          <span>Progress</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: pct === 100 ? 'hsl(var(--primary))' : 'hsl(var(--accent))' }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  No topics match your search.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Teaser for guests */}
        {!isPending && !isSignedIn && (
          <section className="py-xxl" style={{ background: 'hsl(var(--card))' }}>
            <div className="max-w-content mx-auto px-5 sm:px-6 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-4" style={{ color: 'hsl(var(--primary))' }} />
              <h2 className="text-3xl mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                What you get with a free account
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-base mt-8 text-left">
                {[
                  { icon: '📖', title: 'Guided Lessons', desc: 'Step-by-step lessons with history, vocabulary, meaning, and practice exercises.' },
                  { icon: '✅', title: 'Progress Tracking', desc: 'Mark lessons complete, track your progress per topic, and pick up where you left off.' },
                  { icon: '🔖', title: 'Bookmarks & Quizzes', desc: 'Bookmark lessons for later and test your knowledge with interactive quizzes.' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-6 rounded-2xl"
                    style={{ background: 'hsl(var(--card-deep))', border: '1px solid hsl(var(--border))' }}
                  >
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h3 className="text-lg mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>{item.title}</h3>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  to="/signup"
                  className="inline-block px-8 py-3 rounded-full font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
                >
                  Create Your Free Account
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
