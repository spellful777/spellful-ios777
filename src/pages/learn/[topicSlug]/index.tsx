import { useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { ChevronRight, BookOpen, CheckCircle, Bookmark, Clock, ArrowLeft } from 'lucide-react';
import { authClient } from '@/lib/auth/auth-client';
import { getTopic } from '@/lib/academy-data';
import { useAcademy } from '@/hooks/useAcademy';

export default function AcademyTopicPage() {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const navigate = useNavigate();
  const { data: sessionData, isPending } = authClient.useSession();
  const { isCompleted, isBookmarked, loading } = useAcademy();

  const topic = topicSlug ? getTopic(topicSlug) : undefined;

  useEffect(() => {
    if (!isPending && !sessionData?.session) {
      void navigate(`/login?redirect=/learn/${topicSlug ?? ''}`);
    }
  }, [isPending, sessionData, navigate, topicSlug]);

  if (isPending || loading) {
    return (
      <main className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: 'hsl(var(--primary))' }} />
          <p style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Loading...</p>
        </div>
      </main>
    );
  }

  if (!sessionData?.session) return null;

  if (!topic) {
    return (
      <main className="max-w-content mx-auto px-5 sm:px-6 py-xxl text-center">
        <p style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>Topic not found.</p>
        <Link to="/learn" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>Back to Academy</Link>
      </main>
    );
  }

  const completedCount = topic.lessons.filter((l) => isCompleted(topic.slug, l.slug)).length;

  return (
    <>
      <Helmet>
        <title>{topic.title} — Spellful Academy | {topic.lessons.length} Lessons</title>
        <meta name="description" content={`${topic.description} ${topic.lessons.length} lessons with quizzes, glossaries, and progress tracking.`} />
        <meta name="robots" content="noindex" />
        <meta property="og:title" content={`${topic.title} — Spellful Academy`} />
        <meta property="og:description" content={topic.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://spellful.com/learn/${topic.slug}`} />
      </Helmet>

      <main>
        {/* Header */}
        <section
          className="py-xxl"
          style={{ background: 'linear-gradient(180deg, hsl(var(--card-deep)) 0%, hsl(var(--background)) 100%)' }}
        >
          <div className="max-w-content mx-auto px-5 sm:px-6">
            <Link
              to="/learn"
              className="inline-flex items-center gap-1 text-sm mb-6 transition-opacity hover:opacity-70"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Academy
            </Link>

            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: 'hsl(var(--muted))' }}
              >
                {topic.icon}
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                  {topic.title}
                </h1>
                <p className="text-base mb-3" style={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-sans)' }}>
                  {topic.subtitle}
                </p>
                <p className="text-sm max-w-2xl" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  {topic.description}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-6 max-w-sm">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                <span>{completedCount} of {topic.lessons.length} lessons complete</span>
                <span>{topic.lessons.length > 0 ? Math.round((completedCount / topic.lessons.length) * 100) : 0}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${topic.lessons.length > 0 ? Math.round((completedCount / topic.lessons.length) * 100) : 0}%`,
                    background: 'hsl(var(--primary))',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Lessons list */}
        <section className="py-xxl">
          <div className="max-w-content mx-auto px-5 sm:px-6">
            <h2 className="text-2xl mb-6" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
              Lessons
            </h2>
            <div className="flex flex-col gap-3">
              {topic.lessons.map((lesson, idx) => {
                const done = isCompleted(topic.slug, lesson.slug);
                const bookmarked = isBookmarked(topic.slug, lesson.slug);
                return (
                  <Link
                    key={lesson.slug}
                    to={`/learn/${topic.slug}/${lesson.slug}`}
                    className="group flex items-center gap-4 p-5 rounded-2xl transition-all hover:scale-[1.01]"
                    style={{
                      background: 'hsl(var(--card))',
                      border: `1px solid ${done ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))'}`,
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                      style={{
                        background: done ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                        color: done ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base" style={{ fontFamily: 'var(--font-heading)', color: 'hsl(var(--foreground))' }}>
                          {lesson.title}
                        </h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: lesson.level === 'beginner' ? 'hsl(var(--success) / 0.15)' : lesson.level === 'intermediate' ? 'hsl(var(--warning) / 0.15)' : 'hsl(var(--destructive) / 0.15)',
                            color: lesson.level === 'beginner' ? 'hsl(var(--success))' : lesson.level === 'intermediate' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          {lesson.level}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        {lesson.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                        <Clock className="w-3 h-3" />
                        {lesson.durationMinutes} min
                      </div>
                      {bookmarked && <Bookmark className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} fill="currentColor" />}
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: 'hsl(var(--primary))' }} />
                    </div>
                  </Link>
                );
              })}
            </div>

            {topic.lessons.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }}>
                  More lessons coming soon.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
